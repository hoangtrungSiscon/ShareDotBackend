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

router.get('/:mainsubjectid/top-recently-added-documents', async (req, res, next) => {
    const {mainsubjectid} = req.params
    try {
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
                            attributes: [],
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    attributes: [],
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: { mainsubjectid: mainsubjectid },
                                            attributes: [],
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    attributes: [],
                    order: [['uploaddate', 'DESC']]
                }
            ],
            where: { accesslevel: 'Public', status: 'Approved' },
            attributes: { exclude: ['filepath']},
            limit: 15
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectid/documents', async (req, res, next) => {
    const {mainsubjectid} = req.params
    try {
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
                            attributes: [],
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    attributes: [],
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: { mainsubjectid: mainsubjectid },
                                            attributes: [],
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
            ],
            where: { accesslevel: 'Public', status: 'Approved' },
            attributes: { exclude: ['filepath']},
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching main documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.post('/:mainsubjectid/add-category', async (req, res, next) => {
    const {mainsubjectid} = req.params
    const {categoryname, subcategoryname, chaptername, chapterorder} = req.body
    try {
        const mainsubject = await models.mainsubjects.findOne({
            where: {mainsubjectid:mainsubjectid},
        });

        const [category, categoryIsCreated] = await models.categories.findOrCreate({
            categoryname: categoryname,
            defaults: {
                categoryname: categoryname,
                parentcategoryid: null,
                mainsubjectid: mainsubject.mainsubjectid
            }
        })

        const [subcategory, subcategoryIsCreated] = await models.categories.findOrCreate({
            categoryname: subcategoryname,
            defaults: {
                categoryname: subcategoryname,
                parentcategoryid: category.categoryid,
            }
        })

        const [chapter, chapterIsCreated] = await models.chapters.findOrCreate({
            chaptername: chaptername,
            chapterorder: chapterorder,
            defaults: {
                chaptername: chaptername,
                chapterorder: chapterorder,
                categoryid: subcategory.categoryid,
            }
        })
        
        res.status(200).json({message: "Data added successfully."});
    } catch (error) {
        console.error("Error fetching main subject:", error);
        res.status(500).json({ error: "Error adding data" });
    }
});

module.exports = router;