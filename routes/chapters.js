const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);

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

router.get('/:chapterid/documents', async (req, res, next) => {
    const {page = 1, limit = 10, sortby, sortorder = 'DESC', isfree, title} = req.query
    const {chapterid} = req.params
    try {
        const document_sort_order = [];
        const upload_sort_order = [];

        whereClause = [{
            chapterid: chapterid
        }]
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }});
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