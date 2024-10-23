const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const { Op, where } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetype, accesslevel, status, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
     } = req.query
    try {
        whereClause = {}
        if (filetype) {
            whereClause.filetype = filetype
        }
        if (status) {
            whereClause.status = status
        }
        if (title) {
            whereClause.title = { [Op.substring]: title }; // Tìm kiếm substring
        }
        if (isfree === 'true') {
            whereClause.pointcost = { [Op.eq]: 0 }
        } else if (isfree === 'false') {
            whereClause.pointcost = { [Op.ne]: 0 }
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost', ''].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
            order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
        }

        const documents = await models.documents.findAll({
            where: whereClause,
            include: [
                {
                    model: models.chapters,
                    as: 'chapter',
                    required: true,
                    where: chapterid ? { chapterid: chapterid } : {},
                    // attributes: [],
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            where: subcategoryid ? { categoryid: subcategoryid } : {},
                            // attributes: [],
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    where: categoryid ? { categoryid: categoryid } : {},
                                    // attributes: [],
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: mainsubjectid ? { mainsubjectid: mainsubjectid } : {},
                                            // attributes: [],
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
            ],
            order: order.length > 0 ? order : [['documentid', 'DESC']],
        })
        res.status(200).json(documents);
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
    const {documentid} = req.params
    try {
        const documents = await models.documents.findOne({
            where: { documentid:documentid },
        });
        res.status(200).json(documents);
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

module.exports = router;