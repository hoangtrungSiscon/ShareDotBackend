const express = require('express');
const router = express.Router();


const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

router.get('/', async (req, res, next) => {
    try {
        const mainsubjects = await models.mainsubjects.findAll();
        res.status(200).json(mainsubjects);
    } catch (error) {
        console.error("Error fetching main subjects:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

router.get('/:mainsubjectid', async (req, res, next) => {
    const {mainsubjectid} = req.params
    try {
        const mainsubjects = await models.mainsubjects.findAll({
            where: {mainsubjectid:mainsubjectid},
        });
        res.status(200).json(mainsubjects);
    } catch (error) {
        console.error("Error fetching main subject:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

router.get('/:mainsubjectid/categories', async (req, res, next) => {
    const {mainsubjectid} = req.params
    try {
        const categories = await models.categories.findAll({
            where: {mainsubjectid:mainsubjectid, parentcategoryid: null},
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

module.exports = router;