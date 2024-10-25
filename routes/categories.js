const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
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
    const { parentcategoryid } = req.params
    const { sortorder, subcategoryname } = req.query;
    try {
        whereClauses = [{
            parentcategoryid: parentcategoryid
        }]
        if (subcategoryname) {
            whereClauses.push({categoryname: { [Op.iLike]: `%${subcategoryname}%` }});
        }
        const subcategories = await models.categories.findAll({
            where: whereClauses,
            order: sortorder ? [['categoryname', sortorder === 'ASC' ? 'ASC' : 'DESC']] : [],
        });
        res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/:categoryid/chapters', async (req, res, next) => {
    const { sortorder, chaptername } = req.query;
    const { categoryid } = req.params
    try {
        whereClauses = [{
            categoryid: categoryid
        }]
        if (chaptername) {
            // whereClauses.push({chaptername: { [Op.substring]: chaptername }});
            whereClauses.push({chaptername: { [Op.iLike]: `%${chaptername}%` }});
            console.log(whereClauses)
        }
        const chapters = await models.chapters.findAll({
            where: whereClauses,
            order: sortorder ? [['chaptername', sortorder === 'ASC' ? 'ASC' : 'DESC']] : [],
        });
        res.status(200).json(chapters);
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
            where: { accesslevel: 'Public', status: 'Approved' },
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