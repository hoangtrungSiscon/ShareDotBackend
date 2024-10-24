const express = require('express');
const router = express.Router();


const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

router.get('/', async (req, res, next) => {
    const { sortorder } = req.query;
    try {
        order = []
        if (sortorder) {
            order = [['mainsubjectname', sortorder === 'ASC' ? 'ASC' : 'DESC']];
        }
        const mainsubjects = await models.mainsubjects.findAll({
            order: order.length > 0 ? order : [],
        });
        res.status(200).json(mainsubjects);
    } catch (error) {
        console.error("Error fetching main subjects:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

router.get('/:mainsubjectid', async (req, res, next) => {
    const {mainsubjectid} = req.params
    try {
        const mainsubject = await models.mainsubjects.findOne({
            where: {mainsubjectid:mainsubjectid},
        });
        res.status(200).json(mainsubject);
    } catch (error) {
        console.error("Error fetching main subject:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

router.get('/:mainsubjectid/categories', async (req, res, next) => {
    const { sortorder } = req.query;
    const {mainsubjectid} = req.params
    try {
        order = []
        if (sortorder) {
            order = [['categoryname', sortorder === 'ASC' ? 'ASC' : 'DESC']];
        }
        const categories = await models.categories.findAll({
            where: {mainsubjectid:mainsubjectid, parentcategoryid: null},
            order: order.length > 0 ? order : [],
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

module.exports = router;