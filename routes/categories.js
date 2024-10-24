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
    const { sortorder } = req.query;
    try {
        order = []
        if (sortorder) {
            order = [['categoryname', sortorder === 'ASC' ? 'ASC' : 'DESC']];
        }
        const subcategories = await models.categories.findAll({
            where: {parentcategoryid:parentcategoryid},
            order: order.length > 0 ? order : [],
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/:categoryid/chapters', async (req, res, next) => {
    const { sortorder } = req.query;
    const {categoryid} = req.params
    try {
        order = []
        if (sortorder) {
            order = [['chaptername', sortorder === 'ASC' ? 'ASC' : 'DESC']];
        }
        const subcategories = await models.chapters.findAll({
            where: {categoryid:categoryid},
            order: order.length > 0 ? order : [],
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/:subcategoryid/recommendedDocuments', async (req, res, next) => {
    const {subcategoryid} = req.params
    try {
        // const subcategories = await models.chapters.findAll({
        //     where: {categoryid:categoryid},
        // });
        const documents = await models.documents.findAll({
            include: [
                {
                    model: models.chapters,
                    as: 'chapter',
                    required: true,
                    attributes: [],
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            where: { categoryid: subcategoryid },
                            attributes: [],
                        }
                    ]
                }
            ],
            order: [['viewcount', 'DESC']],
            limit: 10
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

module.exports = router;