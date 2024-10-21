const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
    const {mainsubjectid, categoryid, chapterid, title, filetype, accesslevel, status, } = req.query
    try {
        whereClause = {}
        if (filetype) {
            whereClause.filetype = filetype
        }
        if (accesslevel) {
            whereClause.accesslevel = accesslevel
        }
        if (status) {
            whereClause.status = status
        }
        if (title) {
            whereClause.title = { [Op.substring]: title }; // Tìm kiếm substring
        }

        const documents = await models.documents.findAll({
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
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
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

module.exports = router;