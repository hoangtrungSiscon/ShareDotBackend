const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const { formatName} = require('../services/azureStorageService');
const { Op, Sequelize, where } = require('sequelize');
const { authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const Document = require('../mongodb_schemas/documents');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.get('/', identifyUser, async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree
    } = req.query

    const user = req.user;

    try {
        const query = {};
        const sort = {};

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        if (mainsubjectid) {
            query.mainsubjectid = mainsubjectid;
        }
        if (categoryid) {
            query.categoryid = categoryid;
        }
        if (subcategoryid) {
            query.subcategoryid = subcategoryid;
        }
        if (chapterid) {
            query.chapterid = chapterid;
        }

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (isfree === 'true') {
            query.pointcost = 0;
        } else if (isfree === 'false') {
            query.pointcost = { $ne: 0 };
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.uploaddate = -1; // Sắp xếp mặc định
        }

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/addable-user-to-allowed-list/:username', authMiddleware, async (req, res, next) => {
    const user = req.user;
    const { username } = req.params;
    try {
        const active_users = await models.users.findOne({
            where: {
                username: username,
                isactive: 1,
                userid: { [Op.ne]: user.userid }
            },
            attributes: ['userid', 'username', 'fullname'],
            raw: true
        })

        if (!active_users) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(active_users);
    } catch (error) {
        console.error("Error finding users:", error);
        res.status(500).json({ error: "Error finding users" });
    }
})

router.get('/addable-users-to-allowed-list', authMiddleware, async (req, res, next) => {
    const user = req.user;
    const { search } = req.query;
    try {
        if (!search) {
            return res.status(400).json({ error: "username is required" });
        }
        const active_users = await models.users.findAll({
            where: {
                isactive: 1,
                userid: { [Op.ne]: user.userid },
                [Op.or]: [
                    { username: { [Op.iLike]: `%${search}%` } },
                    { fullname: { [Op.iLike]: `%${search}%` } }
                ]
            },
            attributes: [['userid', 'id'], 'username', 'fullname'],
            raw: true
        })

        res.status(200).json(active_users);
    } catch (error) {
        console.error("Error finding users:", error);
        res.status(500).json({ error: "Error finding users" });
    }
})

router.get('/owner-of-document/:documentid', identifyUser, async(req, res) => {
    const {documentid} = req.params;
    const user = req.user;
    try {
        if (!user){
            res.status(200).json(false);
        }
        else {
            const data = await models.uploads.findOne({
                where: { documentid: documentid, uploaderid: user.userid },
                attributes: ['documentid']
            })
            if (data) {
                res.status(200).json(true);
            }
            else {
                res.status(200).json(false);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/search', async (req, res, next) => {
    const {input} = req.query
    try {
        let documents = [];

        if (input && input !== '') {
            documents = await Document.find({
                title : { $regex: input, $options: 'i' },
                status: 'Approved',
                accesslevel: 'Public',
                isactive: 1
            }).lean()
        }
        res.status(200).json(documents.map(doc => doc.title));
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred" });
    }
})

router.get('/owned-documents', authMiddleware, async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 10, title, filetypegroup, filesizerange, sortby = 'uploaddate', sortorder = 'DESC', categoryid,
        status
     } = req.query;

    try {
        const query = {}; // Truy vấn động
        const sort = {}; // Định nghĩa sắp xếp
        query.isactive = 1
        query.uploaderid = user.userid

        if (status){
            query.status = status
        }

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.documentid = -1; // Sắp xếp mặc định
        }

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/owned-documents/:documentid/details', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const query = {}; // Truy vấn động

        query.isactive = 1
        query.uploaderid = user.userid;
        query.documentid = documentid

        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json(document);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/owned-documents/:username', identifyUser, async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 10, title, filetypegroup, filesizerange, sortby, sortorder = 'DESC', isfree } = req.query;
    const {username} = req.params
    try {
        const query = {}; // Truy vấn động
        const sort = {}; // Định nghĩa sắp xếp

        query.status = 'Approved';
        query.isactive = 1

        const targetUser = await models.users.findOne({
            where: { username: username },
            attributes: ['userid']
        })

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        query.uploaderid = targetUser.userid

        if (user){
            query.$or = [
                { accesslevel: 'Public' },
                { accesslevel: 'Restricted', allowedUsers: { $in: [user.userid] } },
                { accesslevel: 'Restricted', uploaderid: user.userid },
                { accesslevel: 'Private', uploaderid: user.userid }
            ];
        } else {
            query.accesslevel = 'Public';
        }

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (isfree === 'true') {
            query.pointcost = 0;
        } else if (isfree === 'false') {
            query.pointcost = { $ne: 0 };
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.uploaddate = -1; // Sắp xếp mặc định
        }

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/:documentid', identifyUser, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const query = {};

        query.documentid = documentid

        query.status = 'Approved';
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.accesslevel === 'Private') {
            if (user && (user.userid === document.uploaderid || user.role === 'admin')) {

                return res.status(200).json( document);
            } else {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        if (document.accesslevel === 'Restricted') {
            if (user && (user.userid === document.uploaderid || user.role === 'admin' || document.allowedUsers.includes(user.userid))) {
                return res.status(200).json( document);
            } else {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        // Nếu tài liệu không phải private hoặc restricted, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.put('/:documentid/delete', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const document = await Document.findOne(
            { documentid: documentid, uploaderid: user.userid }
        )

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        document.isactive = 0;

        await models.documents.update({ isactive: 0}, { where: { documentid: documentid } });
        await document.save();

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã xóa tài liệu "${document.title}"`,
        })

        res.status(200).json({ message: "Document deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Error deleting document" });
    }
})

router.put('/:documentid/update-allowed-list', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    const { userlist } = req.body;

    try {
        const document = await Document.findOne(
            { documentid: documentid, uploaderid: user.userid }
        )

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        document.accesslevel = 'Restricted';

        if (!userlist || userlist.length === 0) {
            document.allowedUsers = [];
            await document.save();
            return res.status(200).json({ message: "Allowed list updated successfully" });
        }

        const active_users = await models.users.findAll({
            where: {
                userid: {
                    [Op.in]: userlist
                },
                isactive: 1
            },
            attributes: ['userid', 'email'],
            raw: true
        })

        const currentAllowedUsers = document.allowedUsers;

        const useridList = active_users.map(user => user.userid);

        const newAddedUsers = active_users.filter(user => !currentAllowedUsers.includes(user.userid));

        document.allowedUsers = useridList;

        await document.save();

        const emailList = newAddedUsers.map(user => user.email);

        const link = `${process.env.CLIENT_URL}/document-detail/${document.slug}`;

        if (emailList.length > 0) {
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailList,
                subject: 'Bạn đã được chia sẻ tài liệu',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Tuyệt vời! Tài liệu "${document.title}" đã được chia sẻ với bạn!</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; padding: 30px;">
                                    <tr>
                                        <td style="text-align: center; font-size: 24px; font-weight: bold; color: #007bff;">
                                            Tuyệt vời!  <span style="font-size: 1.2em; vertical-align: middle;"></span> Tài liệu "${document.title}" đã được chia sẻ với bạn!
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 20px;">
                                            <p style="margin-bottom: 15px;">Chào ${user.fullname},</p>
                                            <p style="margin-bottom: 15px;">Tài liệu "<strong>${document.title}</strong>" đã được chia sẻ với bạn!</p>
                                            <p style="margin-bottom: 15px;">Bạn có thể xem tại đường dẫn này:</p>
                                            <p style="margin-bottom: 25px;">
                                                <a href="${link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                                    Xem tài liệu
                                                </a>
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 30px; text-align: right; color: #777777; font-size: 14px;">
                                            Trân trọng,<br>
                                            Đội ngũ Share Dot
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            };
            
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error during sending email:", error);
                } else {
                    
                }
            });
        }

        res.status(200).json({ message: "Users added to allowed list successfully" });
    }
    catch (error) {
        console.error("Error adding users to allowed list:", error);
        res.status(500).json({ error: "Error adding users to allowed list" });
    }
})

router.get('/:documentid/get-allowed-users', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;

    try {
        const document = await Document.findOne(
            { documentid: documentid, uploaderid: user.userid }
        ).select('allowedUsers').lean()

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const active_users = await models.users.findAll({
            where: {
                userid: {
                    [Op.in]: document.allowedUsers
                },
                isactive: 1
            },
            attributes: ['userid', 'username', 'fullname'],
            raw: true
        })

        res.status(200).json(active_users);
    }
    catch (error) {
        console.error("Error adding users to allowed list:", error);
        res.status(500).json({ error: "Error adding users to allowed list" });
    }
})

router.post('/title/title-exists', async (req, res, next) => {
    const { title } = req.body;
    try {
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const possibleSlug = formatName(title);
        const document = await models.documents.findOne({
            where: { slug: possibleSlug}
        })
        res.json({ exists: !!document });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/slug/:slug', identifyUser, async (req, res, next) => {
    const { slug } = req.params;
    const user = req.user;

    try {
        const query = {};

        query.slug = slug

        query.status = 'Approved';
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

        if (document.accesslevel === 'Private') {
            if (user && (user.userid === document.uploaderid || user.role === 'admin')) {

                return res.status(200).json( document);
            } else {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        if (document.accesslevel === 'Restricted') {
            if (user && (user.userid === document.uploaderid || user.role === 'admin' || document.allowedUsers.includes(user.userid))) {
                return res.status(200).json( document);
            } else {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        if (user){
            const interactionData = await models.documentinteractions.findOne({
                attributes: ['documentid', 'isliked', 'isbookmarked'],
                where: {
                    userid: user.userid
                },
                raw: true
            })

            document.isliked = interactionData ? interactionData.isliked : false;
            document.isbookmarked = interactionData ? interactionData.isbookmarked : false;
        } else {
            document.isliked = false;
            document.isbookmarked = false;
        }

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.put('/:documentid/download', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        if (!user) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!documentid) {
            return res.status(400).json({ error: "Document ID is required" });
        }

        const document = await Document.findOne(
            { documentid: documentid, isactive: 1 }
        ).select('pointcost uploaderid allowedUsers accesslevel status title').lean();

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.accesslevel === 'Private') {
            if (user.userid !== document.uploaderid) {
                if (user.role !== 'admin') {
                    return res.status(403).json({ message: "Access denied" });
                }
            }
        }

        if (document.accesslevel === 'Restricted') {
            if (user.userid !== document.uploaderid) {
                if (user.role !== 'admin') {
                    if (!document.allowedUsers.includes(user.userid) || document.status !== 'Approved') {
                        return res.status(403).json({ message: "Access denied" });
                    }
                }
            }
        }

        const pointcost = document.pointcost

        const remainingPoint = await models.users.findOne({
            where: { userid: user.userid },
            attributes: ['point']
        });

        if (remainingPoint.point < pointcost) {
            return res.status(403).json({ message: 'Insufficient point' });
        }

        await models.users.increment({point: -pointcost}, {where: {userid: user.userid}});

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã tải tài liệu "${document.title}"`,
        })
        
        res.status(200).json({ message: 'Document downloaded successfully' });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error downloading document" });
    }
});

router.get('/interacted/documents', authMiddleware, async (req, res, next) => {
    const {title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree,
        hasLiked = false, hasBookmarked = false
    } = req.query

    const user = req.user;

    try {
        const query = {}; // Truy vấn động
        const sort = {}; // Định nghĩa sắp xếp

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (isfree === 'true') {
            query.pointcost = 0;
        } else if (isfree === 'false') {
            query.pointcost = { $ne: 0 };
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.uploaddate = -1; // Sắp xếp mặc định
        }

        interactionFilters = [{userid: user.userid}];

        if (hasLiked === 'true') {
            interactionFilters.push({isliked: true});
        }

        if (hasBookmarked === 'true') {
            interactionFilters.push({isbookmarked: true});
        }

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: interactionFilters,
            raw: true
        })

        const interactedDocuments_id = interactionData.map(doc => doc.documentid);

        query.documentid = { $in: interactedDocuments_id };
        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});


router.put('/:documentid/change-access-level/:accesslevel', authMiddleware, async (req, res, next) => {
    const { documentid, accesslevel } = req.params;
    const { user } = req;
    try {
        if (!['Public', 'Private'].includes(accesslevel)){
            return res.status(400).json({ error: "Invalid access level" });
        }

        const upload = await models.uploads.findOne({
            where: {
                documentid: documentid,
                uploaderid: user.userid
            }
        });
        if (!upload) {
            return res.status(404).json({ error: "Error changing access level" });
        }

        const document = await models.documents.findOne({
            where: {
                documentid: documentid,
            }
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        document.accesslevel = accesslevel;
        await document.save();

        await Document.findOneAndUpdate(
            {documentid: documentid},
            { accesslevel: accesslevel}
        )

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã đổi chế độ của tài liệu "${document.title}" sang ${accesslevel}`,
        })

        res.status(200).json({ message: 'Access level changed successfully' });
    } catch (error) {
        console.error("Error changing access level:", error);
        res.status(500).json({ error: "Error changing access level" });
    }
})

module.exports = router;