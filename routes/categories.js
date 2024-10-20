const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const mainsubjects = require('../models/mainsubjects');
const models = initModels(sequelize);

router.get('/:categoryid', async (req, res, next) => {
    const {categoryid} = req.params
    try {
        const categories = await models.categories.findOne({
            where: {categoryid:categoryid},
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching category", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/:parentcategoryid/subcategories', async (req, res, next) => {
    const {parentcategoryid} = req.params
    try {
        const subcategories = await models.categories.findAll({
            where: {parentcategoryid:parentcategoryid},
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/:categoryid/chapters', async (req, res, next) => {
    const {categoryid} = req.params
    try {
        const subcategories = await models.chapters.findAll({
            where: {categoryid:categoryid},
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

module.exports = router;