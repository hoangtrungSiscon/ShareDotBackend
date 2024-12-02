const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const { formatName} = require('../services/azureStorageService');
const { Op, Sequelize } = require('sequelize');
const { authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');

router.get('/', async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
    } = req.query

    const user = req.user;
    try {
        whereClause = []

        if (mainsubjectid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN
                    (SELECT categoryid FROM categories WHERE parentcategoryid IN
                    (SELECT categoryid FROM categories WHERE mainsubjectid = ${sequelize.escape(mainsubjectid)})))`)
            }});
        }
        if (categoryid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN (SELECT categoryid FROM categories WHERE parentcategoryid = ${categoryid}))`)
            }});
        }
        if (subcategoryid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid = ${sequelize.escape(subcategoryid)})`)
            }});
        }
        if (chapterid) {
            whereClause.push({chapterid: chapterid});
        }
        

        if (filetypegroup){
            switch (filetypegroup) {
                case 'document':
                    whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
                    break;
                case 'spreadsheet':
                    whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
                    break;
                case 'image':
                    whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
                    break;
                case 'audio':
                    whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
                    break;
                case 'video':
                    whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
                    break;
                case 'presentation':
                    whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
                    break;
                default:
                    break;
            }
        }
        if (filesizerange){
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
        }
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }})
        }
        if (isfree === 'true') {
            whereClause.push({pointcost: { [Op.eq]: 0 }})
        } else if (isfree === 'false') {
            whereClause.push({pointcost: { [Op.ne]: 0 }})
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        const { count, rows }  = await models.documents.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    attributes: ['uploaddate', 'uploaderid'],
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
            offset: (page - 1) * limit,
            limit: limit,
            attributes: {
                exclude: ['filepath'],
            }
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/pending-documents', async (req, res, next) => {
    const {title, filetypegroup, filesizerange, page = 1, limit = 5,
        sortby, sortorder = 'DESC'
    } = req.query

    try {
        whereClause = [
            {
                status: 'Pending'
            },
        ]

        if (filetypegroup){
            switch (filetypegroup) {
                case 'document':
                    whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
                    break;
                case 'spreadsheet':
                    whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
                    break;
                case 'image':
                    whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
                    break;
                case 'audio':
                    whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
                    break;
                case 'video':
                    whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
                    break;
                case 'presentation':
                    whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
                    break;
                default:
                    break;
            }
        }
        if (filesizerange){
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
        }
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }})
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        const { count, rows }  = await models.documents.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
            offset: (page - 1) * limit,
            limit: limit,
            attributes: {
                exclude: ['filepath'],
            }
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
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
        whereClause = [
            {
                status: status
            },
        ]

        if (filetypegroup){
            switch (filetypegroup) {
                case 'document':
                    whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
                    break;
                case 'spreadsheet':
                    whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
                    break;
                case 'image':
                    whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
                    break;
                case 'audio':
                    whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
                    break;
                case 'video':
                    whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
                    break;
                case 'presentation':
                    whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
                    break;
                default:
                    break;
            }
        }
        if (filesizerange){
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
        }
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }})
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        const { count, rows }  = await models.documents.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
            offset: (page - 1) * limit,
            limit: limit,
            attributes: {
                exclude: ['filepath'],
            }
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid },
            attributes: { exclude: ['filepath'] },
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
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
            ]
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
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
        const document = await models.documents.findOne({
            where: { slug: slug },
            attributes: { exclude: ['filepath'] },
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
                            attributes: ['fullname', 'userid']
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
            ]
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.post('/upload-document', async (req, res, next) => {
    const user = req.user;
    const { title, description, filetype, filepath, filesize, chapterid } = req.body;
    try {
        const newDocument = await models.documents.create({
            title,
            description,
            filetype,
            filepath,
            filesize,
            chapterid
        })
        const newUpload = await models.uploads.create({
            documentid: newDocument.documentid,
            uploaderid: user.userid
        })
        res.status(201).json({ message: 'Document uploaded successfully' });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Error uploading document" });
    }
});

router.put('/:documentid/download', async (req, res, next) => {
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

router.put('/:documentid/change-status/:status', async (req, res, next) => {
    try {
        const { documentid, status } = req.params;
        if (['Pending', 'Approved', 'Rejected'].includes(status) === false) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await models.documents.update(
            { status },
            { where: { documentid: documentid } }
        );
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

module.exports = router;