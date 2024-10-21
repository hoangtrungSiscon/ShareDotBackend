const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');
const initModels = require('../models/init-models');
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
    const {chapterid} = req.params
    try {
        const documents = await models.documents.findAll({
            where: {chapterid:chapterid},
        });
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
})
module.exports = router;