const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const mainsubjects = require('../models/mainsubjects');
const models = initModels(sequelize);


router.get('/categoryByID', async (req, res, next) => {
    const {mainsubjectid} = req.body
    try {
        const categories = await models.categories.findAll({
            where: {mainsubjectid:mainsubjectid,parentcategoryid:null},
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});
router.get('/subcategoryByID', async (req, res, next) => {
    const {parentcategoryid} = req.body
    try {
        const subcategories = await models.categories.findAll({
            where: {parentcategoryid:parentcategoryid},
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching categories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});
module.exports = router;