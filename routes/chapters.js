const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');

router.get('/:chapterid', async (req, res, next) => {
    const {chapterid} = req.params
    try {
        const chapters = await models.chapters.findOne({
            where: {chapterid:chapterid},
        });
        res.status(200).json(chapters);
    } catch (error) {
        console.error("Error fetching chapter", error);
        res.status(500).json({ error: "Error fetching chapter" });
    }
});

router.get('/:chapterid/documents', identifyUser, async (req, res, next) => {
    const {page = 1, limit = 10, sortby, sortorder = 'DESC', isfree, title, filetypegroup, filesizerange} = req.query
    const {chapterid} = req.params

    const user = req.user;

    try {
        const document_sort_order = [];
        const upload_sort_order = [];

        whereClause = [
            {
                chapterid: chapterid
            },
            {
                accesslevel: 'Public'
            },
            {
                status: 'Approved'
            },
            
        ]
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }});
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
        if (isfree === 'true') {
            whereClause.push({pointcost: { [Op.eq]: 0 }});
        } else if (isfree === 'false') {
            whereClause.push({pointcost: { [Op.ne]: 0 }});
        }

        if (sortby) {
            if (['title', 'viewcount', 'likecount'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        const documents = await models.documents.findAll({
            where: whereClause,
            order: document_sort_order.length > 0 ? document_sort_order : [],
            includes: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                    attributes: []
                },
                {
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: false,
                    where: { userid: user ? user.userid : null },
                }
            ],
            attributes: { exclude: ['filepath']},
        });
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
})
module.exports = router;