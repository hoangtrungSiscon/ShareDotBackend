const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

router.get('/chapterByID', async (req, res, next) => {
    const {categoryid} = req.body
    try {
        const chapters = await models.chapters.findAll({
            where: {categoryid:categoryid},
        });
        res.status(200).json(chapters);
    } catch (error) {
        console.error("Error fetching chapters", error);
        res.status(500).json({ error: "Error fetching chapters" });
    }
});
module.exports = router;