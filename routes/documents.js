const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const { Op } = require('sequelize');
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');

router.get('/', identifyUser, async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, status, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
    } = req.query

    const user = req.user;
    try {
        whereClause = [
            {
                accesslevel: 'Public'
            },
            {
                status: 'Approved'
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
        if (status) {
            whereClause.status = status
        }
        if (title) {
            whereClause.title = { [Op.iLike]: `%${title}%` };
        }
        if (isfree === 'true') {
            whereClause.pointcost = { [Op.eq]: 0 }
        } else if (isfree === 'false') {
            whereClause.pointcost = { [Op.ne]: 0 }
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
                    model: models.chapters,
                    as: 'chapter',
                    required: true,
                    where: chapterid ? { chapterid: chapterid } : {},
                    attributes: [],
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            where: subcategoryid ? { categoryid: subcategoryid } : {},
                            attributes: [],
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    where: categoryid ? { categoryid: categoryid } : {},
                                    attributes: [],
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: mainsubjectid ? { mainsubjectid: mainsubjectid } : {},
                                            attributes: [],
                                        },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                },
                {
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: false,
                    where: { userid: user ? user.userid : null },
                }
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
            offset: (page - 1) * limit,
            limit: limit
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

router.get('/owned-documents', authMiddleware, async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;
    try {
        const { count, rows } = await models.uploads.findAndCountAll({
            include: [
                {
                    model: models.documents,
                    as: 'document',
                    required: true,
                }
            ],
            where: { uploaderid: user.userid },
            offset: (page - 1) * limit,
            limit: limit
        });
        res.setHeader('X-Total-Count', count);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid, status: 'Approved' },
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

        if (document.accesslevel === 'Private') {
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && user.userid === document.uploads[0].uploaderid) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/slug/:slug', async (req, res, next) => {
    const { slug } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { slug: slug, status: 'Approved' },
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

        if (document && document.accesslevel === 'Private') {
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && user.userid === document.uploads[0].uploaderid) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.post('/upload-document', authMiddleware, async (req, res, next) => {
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

module.exports = router;