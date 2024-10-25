const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

router.get('/', async (req, res, next) => {
    const { sortorder, mainsubjectname } = req.query;
    try {
        const mainsubjects = await models.mainsubjects.findAll({
            order: sortorder ? [['mainsubjectname', sortorder === 'ASC' ? 'ASC' : 'DESC']] : [],
            where: mainsubjectname ? {mainsubjectname: { [Op.iLike]: `%${mainsubjectname}%` }} : {},
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
    const { sortorder, categoryname } = req.query;
    const { mainsubjectid } = req.params
    try {
        whereClauses = [{
            mainsubjectid: mainsubjectid,
            parentcategoryid: null
        }]
        if (categoryname) {
            whereClauses.push({categoryname: { [Op.iLike]: `%${categoryname}%` }});
        }
        const categories = await models.categories.findAll({
            where: whereClauses,
            order: sortorder ? [['categoryname', sortorder === 'ASC' ? 'ASC' : 'DESC']] : [],
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

module.exports = router;