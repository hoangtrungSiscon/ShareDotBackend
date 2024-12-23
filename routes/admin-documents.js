const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { Op, Sequelize } = require('sequelize');
const { authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const Document = require('../mongodb_schemas/documents');
const nodemailer = require('nodemailer');
const { getBlobURL, uploadBlob, formatName, deleteBlob } = require('../services/azureStorageService');
const multer = require('multer');
const upload = multer();
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.get('/', async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
    } = req.query

    const user = req.user;
    
    try {
        const query = {};
        const sort = {};

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

        // Điều chỉnh trang hiện tại nếu vượt quá số trang hợp lệ
        // const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);
        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);


        const skip = (currentPage - 1) * pageSize;

        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

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

router.get('/status/:status', async (req, res, next) => {
    const {title, filetypegroup, filesizerange, page = 1, limit = 5,
        sortby, sortorder = 'DESC'
    } = req.query

    const { status } = req.params;
    
    try {
        const query = {};
        const sort = {};

        query.isactive = 1
        query.status = status;

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
            sort.uploaddate = 1;
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

router.post('/upload-document', authMiddleware, upload.single('file'),  async (req, res) => {
    const { title, description, accesslevel, filesize, chapterid, categoryid, subcategoryid, mainsubjectid } = req.body;
    const user = req.user;
    try {
        if (!req.file) return res.status(400).json({ message: 'No file!' });

        const possibleSlug = formatName(title);

        const documents = await models.documents.findAll({
            where: { slug: possibleSlug }
        });

        if (documents.length > 0) {
            return res.status(400).json({ message: 'Conflict with title' });
        }

        const data = await models.chapters.findOne({
            where: { chapterid: chapterid },
            // attributes: ['chaptername'],
            include: [
                {
                    model: models.categories,
                    as: 'category',
                    required: true,
                    where: { categoryid: subcategoryid },
                    include: [
                        {
                            model: models.categories,
                            as: 'parentcategory',
                            required: true,
                            where: { categoryid: categoryid, parentcategoryid: null },
                            include: [
                                {
                                    model: models.mainsubjects,
                                    as: 'mainsubject',
                                    required: true,
                                    where: { mainsubjectid: mainsubjectid },
                                }
                            ]
                        }
                    ]
                }
            ]
        })

        if (!data) {
            return res.status(404).json({ error: 'Wrong structure' });
        }

        const filepath = formatName(data.category.parentcategory.mainsubject.mainsubjectname)
        + '/' + formatName(data.category.parentcategory.categoryname)
        + '/' + formatName(data.category.categoryname)
        + '/' + formatName(data.chaptername);

        console.log(filepath);
        const storageFilePath = await uploadBlob(filepath, req.file.buffer, req.file.originalname);

        const extension = path.extname(req.file.originalname).replace('.', '');

        const document = await models.documents.create({
            title: title,
            description: description,
            filetype: extension,
            filepath: storageFilePath,
            filesize: filesize,
            chapterid: chapterid,
            accesslevel: accesslevel,
            status: 'Approved',
            slug: formatName(title)
        });

        const newUpload = await models.uploads.create({
            documentid: document.documentid,
            uploaderid: user.userid
        })

        const document_detail = await models.documents.findOne({
            where: { documentid: document.documentid },
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid', 'username']
                        }
                    ]
                },
                {
                    model: models.chapters,
                    as: 'chapter',
                    required: true,
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
        });

        await Document.create({
            title: document_detail.title,
            documentid: document_detail.documentid,
            mainsubjectid: document_detail.chapter.category.parentcategory.mainsubject.mainsubjectid,
            mainsubjectname: document_detail.chapter.category.parentcategory.mainsubject.mainsubjectname,
            categoryid: document_detail.chapter.category.parentcategory.categoryid,
            categoryname: document_detail.chapter.category.parentcategory.categoryname,
            subcategoryid: document_detail.chapter.category.categoryid,
            subcategoryname: document_detail.chapter.category.categoryname,
            chapterid: document_detail.chapter.chapterid,
            chaptername: document_detail.chapter.chaptername,
            filetype: document_detail.filetype,
            filesize: document_detail.filesize,
            accesslevel: document_detail.accesslevel,
            status: document_detail.status,
            viewcount: document_detail.viewcount,
            pointcost: document_detail.pointcost,
            description: document_detail.description,
            uploaddate: document_detail.uploads[0].uploaddate,
            filepath: document_detail.filepath,
            uploaderid: document_detail.uploads[0].uploaderid,
            uploadername: document_detail.uploads[0].uploader.fullname,
            isactive: document_detail.isactive,
            slug: document_detail.slug,
            uploaderusername: document_detail.uploads[0].uploader.username
        });

        res.status(200).json({ message: 'Document uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
        console.log(error);
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;

    try {
        const query = {};

        query.documentid = documentid
        query.isactive = 1


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

router.put('/:documentid/update-point', async (req, res, next) => {
    const { documentid } = req.params;
    const { pointcost } = req.body;
    try {
        const query = {};

        query.documentid = documentid
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        document.pointcost = pointcost;
        await document.save();

        await models.documents.update({ pointcost: pointcost }, { where: { documentid: documentid, isactive: 1 } });

        res.status(200).json({ message: 'Point cost updated successfully' });
    }
    catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Error updating document" });
    }
});

router.post('/title/title-exists', async (req, res, next) => {
    const { title } = req.body;
    try {
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

router.get('/slug/:slug', async (req, res, next) => {
    const { slug } = req.params;
    
    try {
        const query = {};

        query.slug = slug
        query.isactive = 1


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

router.put('/:documentid/change-status/:status', async (req, res, next) => {
    const { documentid, status } = req.params;
    try {
        if (['Pending', 'Approved', 'Rejected'].includes(status) === false) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await models.documents.update(
            { status },
            { where: { documentid: documentid } }
        );

        const document = await Document.findOneAndUpdate(
            {documentid: documentid},
            { status: status}
        )

        const user = await models.users.findOne({
            where: {userid: document.uploaderid},
            attributes: ['email', 'userid']
        })

        let mailOptions

        if (status === 'Approved') {
            const link = `${process.env.CLIENT_URL}/document-detail/${document.slug}`;
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Tài liệu của bạn đã được duyệt',
                html: `<p>Chúc mừng! Tài liệu của bạn đã được duyệt.</p>
                
                <p>Bấm vào đây để đi đến tài liệu của bạn: <a href="${link}">${document.title}</a></p>`
            };
        }

        if (status === 'Rejected') {
            const link = `${process.env.CLIENT_URL}/owned-documents`;
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Tài liệu của bạn đã bị từ chối.',
                html: `<p>Vì một số lý do, chúng tôi đã từ chối tài liệu của bạn.</p>
                
                <p>Tài liệu bị từ chối: <a href="${link}">${document.title}</a></p>`
            };
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error during forgot password:", error);
                res.status(500).json({ error: 'An error occurred during forgot password' });
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json({ message: 'Email sent successfully' });
            }
        });
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})


module.exports = router;