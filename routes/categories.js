const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
    try {
        const categories = await models.categories.findAll();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching category", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

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

router.get('/find-with-slug/:slug', async (req, res, next) => {
    const {slug} = req.params
    try {
        const category = await models.categories.findOne({
            where: {slug: slug},
        });
        res.status(200).json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Error fetching category" });
    }
});

router.get('/find-with-slug/:slug/subcategories', async (req, res, next) => {
    const {slug} = req.params
    try {
        const categories = await models.categories.findAll({
            include: [
                {
                    model: models.categories,
                    as: 'parentcategory',
                    required: true,
                    where: {slug: slug},
                }
            ]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
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
            whereClauses.push({chaptername: { [Op.iLike]: `%${chaptername}%` }});
            console.log(whereClauses)
        }
        const chapters = await models.chapters.findAll({
            where: whereClauses,
            order: sortorder ? [['chaptername', sortorder === 'ASC' ? 'ASC' : 'DESC']] : [],
        });
        res.status(200).json(chapters);
    } catch (error) {
        console.error("Error fetching chapters", error);
        res.status(500).json({ error: "Error fetching chapters" });
    }
});

router.get('/:subcategoryid/recommendedDocuments', identifyUser, async (req, res, next) => {
    const {subcategoryid} = req.params
    const user = req.user
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
                            where: { categoryid: subcategoryid },
                            attributes: [],
                        }
                    ]
                },
                {
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: false,
                    where: { userid: user ? user.userid : null },
                }
            ],
            where: { accesslevel: 'Public', status: 'Approved' },
            order: [['viewcount', 'DESC']],
            limit: 10,
            attributes: { exclude: ['filepath']},
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:subcategoryid/top-viewed-documents', identifyUser, async (req, res, next) => {
    const { subcategoryid } = req.params
    const user = req.user
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
                            where: { categoryid: subcategoryid },
                            attributes: [],
                        }
                    ]
                },
                {
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: false,
                    where: { userid: user ? user.userid : null },
                }
            ],
            where: { accesslevel: 'Public', status: 'Approved' },
            order: [['viewcount', 'DESC']],
            limit: 15,
            attributes: { exclude: ['filepath']},
        })
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/find-with-slug/:categoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {categoryslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user;
    try {
        const { count, rows }  = await models.documents.findAndCountAll({
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
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
                                    where: { slug: categoryslug },
                                }
                            ]
                        }
                    ]
                },
            ],
            offset: (page - 1) * limit,
            limit: limit,
            attributes: {
                exclude: ['filepath'],
                include: [
                    [
                      Sequelize.literal(`
                        EXISTS (
                          SELECT 1 FROM documentinteractions
                          WHERE documentinteractions.documentid = documents.documentid
                          AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
                          AND documentinteractions.isliked = TRUE
                        )
                      `),
                      'isliked',
                    ],
                    [
                      Sequelize.literal(`
                        EXISTS (
                          SELECT 1 FROM documentinteractions
                          WHERE documentinteractions.documentid = documents.documentid
                          AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
                          AND documentinteractions.isbookmarked = TRUE
                        )
                      `),
                      'isbookmarked',
                    ],
                ],
            }
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/find-with-slug/subcategories/:subcategoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {subcategoryslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user;
    try {
        const { count, rows }  = await models.documents.findAndCountAll({
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
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
                            where: { slug: subcategoryslug },
                        }
                    ]
                },
            ],
            offset: (page - 1) * limit,
            limit: limit,
            attributes: {
                exclude: ['filepath'],
                include: [
                    [
                      Sequelize.literal(`
                        EXISTS (
                          SELECT 1 FROM documentinteractions
                          WHERE documentinteractions.documentid = documents.documentid
                          AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
                          AND documentinteractions.isliked = TRUE
                        )
                      `),
                      'isliked',
                    ],
                    [
                      Sequelize.literal(`
                        EXISTS (
                          SELECT 1 FROM documentinteractions
                          WHERE documentinteractions.documentid = documents.documentid
                          AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
                          AND documentinteractions.isbookmarked = TRUE
                        )
                      `),
                      'isbookmarked',
                    ],
                ],
            }
        })
        res.status(200).json({
            totalItems: count,  // Tổng số tài liệu
            documents: rows,  // Tài liệu của trang hiện tại
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

module.exports = router;