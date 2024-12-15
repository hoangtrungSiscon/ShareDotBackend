const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const { formatName} = require('../services/azureStorageService');
const { Op, Sequelize, where } = require('sequelize');
const { authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const Document = require('../mongodb_schemas/documents');

router.get('/', identifyUser, async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree
    } = req.query

    const user = req.user;
    // try {
    //     whereClause = [
    //         {
    //             accesslevel: 'Public',
    //         },
    //         {
    //             status: 'Approved'
    //         }
    //     ]

    //     if (mainsubjectid) {
    //         whereClause.push({chapterid : {
    //             [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN
    //                 (SELECT categoryid FROM categories WHERE parentcategoryid IN
    //                 (SELECT categoryid FROM categories WHERE mainsubjectid = ${sequelize.escape(mainsubjectid)})))`)
    //         }});
    //     }
    //     if (categoryid) {
    //         whereClause.push({chapterid : {
    //             [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN (SELECT categoryid FROM categories WHERE parentcategoryid = ${categoryid}))`)
    //         }});
    //     }
    //     if (subcategoryid) {
    //         whereClause.push({chapterid : {
    //             [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid = ${sequelize.escape(subcategoryid)})`)
    //         }});
    //     }
    //     if (chapterid) {
    //         whereClause.push({chapterid: chapterid});
    //     }
        

    //     if (filetypegroup){
    //         switch (filetypegroup) {
    //             case 'document':
    //                 whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
    //                 break;
    //             case 'spreadsheet':
    //                 whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
    //                 break;
    //             case 'image':
    //                 whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
    //                 break;
    //             case 'audio':
    //                 whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
    //                 break;
    //             case 'video':
    //                 whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
    //                 break;
    //             case 'presentation':
    //                 whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
    //                 break;
    //             default:
    //                 break;
    //         }
    //     }
    //     if (filesizerange){
    //         const [minSize, maxSize] = filesizerange.split('-');
    //         const minSizeMB = parseInt(minSize) * 1024 * 1024;
    //         const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
    //         whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
    //     }
    //     if (title) {
    //         whereClause.push({title: { [Op.iLike]: `%${title}%` }})
    //     }
    //     if (isfree === 'true') {
    //         whereClause.push({pointcost: { [Op.eq]: 0 }})
    //     } else if (isfree === 'false') {
    //         whereClause.push({pointcost: { [Op.ne]: 0 }})
    //     }

    //     const document_sort_order = [];
    //     const upload_sort_order = [];

    //     if (sortby) {
    //         if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
    //             document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //         }

    //         if (sortby === 'uploaddate'){
    //             upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //         }
    //     }

    //     const { count, rows }  = await models.documents.findAndCountAll({
    //         where: whereClause,
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 duplicating: false,
    //                 attributes: ['uploaddate', 'uploaderid'],
    //                 order: upload_sort_order.length > 0 ? upload_sort_order : [],
    //                 include: [
    //                     {
    //                         model: models.users,
    //                         as: 'uploader',
    //                         required: true,
    //                         attributes: ['fullname', 'userid']
    //                     }
    //                 ]
    //             },
    //             // {
    //             //     model: models.chapters,
    //             //     as: 'chapter',
    //             //     required: true,
    //             //     where: chapterid ? { chapterid: chapterid } : {},
    //             //     attributes: [],
    //             //     include: [
    //             //         {
    //             //             model: models.categories,
    //             //             as: 'category',
    //             //             required: true,
    //             //             where: subcategoryid ? { categoryid: subcategoryid } : {},
    //             //             attributes: [],
    //             //             include: [
    //             //                 {
    //             //                     model: models.categories,
    //             //                     as: 'parentcategory',
    //             //                     required: true,
    //             //                     where: categoryid ? { categoryid: categoryid } : {},
    //             //                     attributes: [],
    //             //                     include: [
    //             //                         {
    //             //                             model: models.mainsubjects,
    //             //                             as: 'mainsubject',
    //             //                             required: true,
    //             //                             where: mainsubjectid ? { mainsubjectid: mainsubjectid } : {},
    //             //                             attributes: [],
    //             //                         },
    //             //                     ]
    //             //                 }
    //             //             ]
    //             //         }
    //             //     ]
    //             // },
    //         ],
    //         order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
    //         offset: (page - 1) * limit,
    //         limit: limit,
    //         attributes: {
    //             exclude: ['filepath'],
    //             include: [
    //                 [
    //                   Sequelize.literal(`
    //                     EXISTS (
    //                       SELECT 1 FROM documentinteractions
    //                       WHERE documentinteractions.documentid = documents.documentid
    //                       AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
    //                       AND documentinteractions.isliked = TRUE
    //                     )
    //                   `),
    //                   'isliked',
    //                 ],
    //                 [
    //                   Sequelize.literal(`
    //                     EXISTS (
    //                       SELECT 1 FROM documentinteractions
    //                       WHERE documentinteractions.documentid = documents.documentid
    //                       AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
    //                       AND documentinteractions.isbookmarked = TRUE
    //                     )
    //                   `),
    //                   'isbookmarked',
    //                 ],
    //             ],
    //         }
    //     })
    //     res.status(200).json({
    //         totalItems: count,  // Tổng số tài liệu
    //         documents: rows,  // Tài liệu của trang hiện tại
    //         currentPage: parseInt(page),
    //         totalPages: Math.ceil(count / limit)
    //     });
    // }

    //=================================================

    

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
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
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
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/search', async (req, res, next) => {
    const {input} = req.query
    try {
        let documents = [];

        // if (input && input !== '') {
        //     documents = await models.documents.findAll({
        //         attributes: ['title'],
        //         where: {
        //             title: {
        //                 [Op.iLike]: `%${input}%`
        //             },
        //             status: 'Approved',
        //             accesslevel: 'Public'
        //         },
        //     });
        // }

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
    // try {
    //     const whereClause = [{
    //         isactive: 1
    //     }];

    //     if (status){
    //         whereClause.push({status: status})
    //     }

    //     if (filetypegroup){
    //         switch (filetypegroup) {
    //             case 'document':
    //                 whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
    //                 break;
    //             case 'spreadsheet':
    //                 whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
    //                 break;
    //             case 'image':
    //                 whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
    //                 break;
    //             case 'audio':
    //                 whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
    //                 break;
    //             case 'video':
    //                 whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
    //                 break;
    //             case 'presentation':
    //                 whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
    //                 break;
    //             default:
    //                 break;
    //         }
    //     }
    //     if (filesizerange){
    //         const [minSize, maxSize] = filesizerange.split('-');
    //         const minSizeMB = parseInt(minSize) * 1024 * 1024;
    //         const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
    //         whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
    //     }
    //     if (title) {
    //         whereClause.push({title: { [Op.iLike]: `%${title}%` }})
    //     }
        
    //     let document_sort_order = [];
    //     let upload_sort_order = [];

    //     if (sortby === 'uploaddate'){
    //         upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //     } else if (['title'].includes(sortby)){
    //         document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //     }

    //     const { count, rows } = await models.uploads.findAndCountAll({
    //         duplicating: false,
    //         include: [
    //             {
    //                 model: models.documents,
    //                 as: 'document',
    //                 required: true,
    //                 duplicating: false,
    //                 where: whereClause,
    //                 order: document_sort_order.length > 0 ? document_sort_order : [],
    //                 attributes: {
    //                     exclude: ['filepath'],
    //                 },
    //             }
    //         ],
    //         order: upload_sort_order.length > 0 ? upload_sort_order : [],
    //         where: {uploaderid: user.userid},
    //         offset: (page - 1) * limit,
    //         limit: limit
    //     });
    //     res.setHeader('X-Total-Count', count);
    //     res.status(200).json({
    //         totalItems: count,
    //         uploads: rows,
    //         currentPage: parseInt(page),
    //         totalPages: Math.ceil(count / limit)
    //     });
    // }
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
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
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
            currentPage: pageNumber,
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
            if (user.userid !== targetUser.userid) {
                query.accesslevel = 'Public';
            }
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
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
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
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;
    // try {
    //     const document = await models.documents.findOne({
    //         where: { documentid: documentid, status: 'Approved' },
    //         attributes: { exclude: ['filepath'] },
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 duplicating: false,
    //                 include: [
    //                     {
    //                         model: models.users,
    //                         as: 'uploader',
    //                         required: true,
    //                         attributes: ['fullname', 'userid']
    //                     }
    //                 ]
    //             },
    //             {
    //                 model: models.chapters,
    //                 as: 'chapter',
    //                 required: true,
    //                 include: [
    //                     {
    //                         model: models.categories,
    //                         as: 'category',
    //                         required: true,
    //                         include: [
    //                             {
    //                                 model: models.categories,
    //                                 as: 'parentcategory',
    //                                 required: true,
    //                                 include: [
    //                                     {
    //                                         model: models.mainsubjects,
    //                                         as: 'mainsubject',
    //                                         required: true,
    //                                     }
    //                                 ]
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             }
    //         ]
    //     });

    //     if (!document) {
    //         return res.status(404).json({ error: "Document not found" });
    //     }

    //     if (document.accesslevel === 'Private') {
    //         return authMiddleware(req, res, async () => {
    //             const user = req.user;

    //             if (user && (user.userid === document.uploads[0].uploaderid || user.role === 'admin')) {

    //                 return res.status(200).json( document);
    //             } else {
    //                 return res.status(403).json({ message: "Access denied" });
    //             }
    //         });
    //     }

    //     // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
    //     res.status(200).json(document);
    // }
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
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && (user.userid === document.uploaderid || user.role === 'admin')) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
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
    // try {
    //     const document = await models.documents.findOne({
    //         where: { documentid: documentid },
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 where: { uploaderid: user.userid }
    //             }
    //         ]
    //     });
    //     if (!document) {
    //         return res.status(404).json({ error: "Document not found" });
    //     }
    //     await models.documents.update({ isactive: 0}, { where: { documentid: documentid } });
    //     res.status(200).json({ message: "Document deleted successfully" });
    // }
    try {
        const document = await Document.findOne(
            { documentid: documentid }
        )

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        document.isactive = 0;

        await models.documents.update({ isactive: 0}, { where: { documentid: documentid } });
        await document.save();
        res.status(200).json({ message: "Document deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Error deleting document" });
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
    // try {
    //     const document = await models.documents.findOne({
    //         where: { slug: slug, status: 'Approved' },
    //         attributes: { exclude: ['filepath'] },
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 include: [
    //                     {
    //                         model: models.users,
    //                         as: 'uploader',
    //                         required: true,
    //                         attributes: ['fullname', 'userid', 'username']
    //                     }
    //                 ]
    //             },
    //             {
    //                 model: models.chapters,
    //                 as: 'chapter',
    //                 required: true,
    //                 include: [
    //                     {
    //                         model: models.categories,
    //                         as: 'category',
    //                         required: true,
    //                         include: [
    //                             {
    //                                 model: models.categories,
    //                                 as: 'parentcategory',
    //                                 required: true,
    //                                 include: [
    //                                     {
    //                                         model: models.mainsubjects,
    //                                         as: 'mainsubject',
    //                                         required: true,
    //                                     }
    //                                 ]
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             }
    //         ]
    //     });

    //     if (!document) {
    //         return res.status(404).json({ error: "Document not found" });
    //     }

    //     if (document && document.accesslevel === 'Private') {
    //         return authMiddleware(req, res, async () => {
    //             const user = req.user;

    //             if (user && user.userid === document.uploads[0].uploaderid) {

    //                 return res.status(200).json( document);
    //             } else {
    //                 return res.status(403).json({ message: "Access denied" });
    //             }
    //         });
    //     }

    //     // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
    //     res.status(200).json(document);
    // }

    try {
        const query = {};

        query.slug = slug

        query.status = 'Approved';
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

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

        if (document.accesslevel === 'Private') {
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && (user.userid === document.uploaderid || user.role === 'admin')) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
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
        const pointcost = await models.documents.findOne({
            where: { documentid: documentid },
            attributes: ['pointcost']
        });

        const remainingPoint = await models.users.findOne({
            where: { userid: user.userid },
            attributes: ['point']
        });

        if (remainingPoint.point < pointcost.pointcost) {
            return res.status(403).json({ message: 'Insufficient point' });
        }

        await models.users.increment({point: -pointcost.pointcost}, {where: {userid: user.userid}});
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
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
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
            currentPage: pageNumber,
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

        res.status(200).json({ message: 'Access level changed successfully' });
    } catch (error) {
        console.error("Error changing access level:", error);
        res.status(500).json({ error: "Error changing access level" });
    }
})

module.exports = router;