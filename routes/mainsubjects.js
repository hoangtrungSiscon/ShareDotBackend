const express = require('express');
const router = express.Router();
const { Op, Sequelize, fn, col, where, QueryTypes  } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const slugify = require('slugify');

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

router.get('/find-with-slug/:slug', async (req, res, next) => {
    const {slug} = req.params
    try {
        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: slug},
        });
        res.status(200).json(mainsubject);
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

router.get('/find-with-slug/:mainsubjectslug/categories', async (req, res, next) => {
    const { mainsubjectslug } = req.params
    try {
        const categories = await models.categories.findAll({
            where: {parentcategoryid: null},
            include: [
                {
                    model: models.mainsubjects,
                    as: 'mainsubject',
                    required: true,
                    where: { slug: mainsubjectslug },
                    attributes: [],
                }
            ]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Error fetching categories" });
    }
});

router.get('/find-with-slug/:mainsubjectslug/all-documents', identifyUser, async (req, res, next) => {
    const {mainsubjectslug} = req.params
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
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: { slug: mainsubjectslug },
                                            attributes: [],
                                        },
                                    ]
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

router.get('/:mainsubjectslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug} = req.params
    try {
        // const documents = await models.documents.findAll({
        //     include: [
        //         {
        //             model: models.chapters,
        //             as: 'chapter',
        //             required: true,
        //             attributes: [],
        //             include: [
        //                 {
        //                     model: models.categories,
        //                     as: 'category',
        //                     required: true,
        //                     attributes: [],
        //                     include: [
        //                         {
        //                             model: models.categories,
        //                             as: 'parentcategory',
        //                             required: true,
        //                             attributes: [],
        //                             include: [
        //                                 {
        //                                     model: models.mainsubjects,
        //                                     as: 'mainsubject',
        //                                     required: true,
        //                                     where: { slug: mainsubjectslug },
        //                                     attributes: [],
        //                                 }
        //                             ]
        //                         }
        //                     ]
        //                 }
        //             ]
        //         },
        //         {
        //             model: models.uploads,
        //             as: 'uploads',
        //             required: true,
        //             attributes: [],
        //             order: [['uploaddate', 'DESC']]
        //         }
        //     ],
        //     where: { accesslevel: 'Public', status: 'Approved' },
        //     attributes: ['title', 'slug', 'description'],
        //     limit: 15
        // })
        
        const documents = await sequelize.query(
            `SELECT documents.title, documents.slug, documents.description
            FROM documents
            INNER JOIN chapters ON documents.chapterid = chapters.chapterid
            INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
            INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
            INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
            INNER JOIN uploads ON documents.documentid = uploads.documentid
            WHERE mainsubjects.slug = :mainsubjectslug
                AND documents.accesslevel = 'Public'
                AND documents.status = 'Approved'
            ORDER BY uploads.uploaddate DESC
            LIMIT 15`,
            {
                replacements: { mainsubjectslug: mainsubjectslug },
                type: QueryTypes.SELECT,
            }
        );

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug} = req.params
    try {
        const documents = await sequelize.query(
            `SELECT documents.title, documents.slug, documents.description
            FROM documents
            INNER JOIN chapters ON documents.chapterid = chapters.chapterid
            INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
            INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
            INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
            INNER JOIN uploads ON documents.documentid = uploads.documentid
            WHERE mainsubjects.slug = :mainsubjectslug
                AND categories.slug = :categoryslug
                AND documents.accesslevel = 'Public'
                AND documents.status = 'Approved'
            ORDER BY uploads.uploaddate DESC
            LIMIT 15`,
            {
                replacements: { mainsubjectslug: mainsubjectslug, categoryslug: categoryslug },
                type: QueryTypes.SELECT,
            }
        );

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/find-with-slug/:mainsubjectslug/categories/:categoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {mainsubjectslug, categoryslug} = req.params
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
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: { slug: mainsubjectslug },
                                            attributes: [],
                                        },
                                    ]
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

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug} = req.params
    try {
        const documents = await sequelize.query(
            `SELECT documents.title, documents.slug, documents.description
            FROM documents
            INNER JOIN chapters ON documents.chapterid = chapters.chapterid
            INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
            INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
            INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
            INNER JOIN uploads ON documents.documentid = uploads.documentid
            WHERE mainsubjects.slug = :mainsubjectslug
                AND categories.slug = :categoryslug
                AND subcategories.slug = :subcategoryslug
                AND documents.accesslevel = 'Public'
                AND documents.status = 'Approved'
            ORDER BY uploads.uploaddate DESC
            LIMIT 15`,
            {
                replacements: {
                    mainsubjectslug: mainsubjectslug,
                    categoryslug: categoryslug,
                    subcategoryslug: subcategoryslug,
                },
                type: QueryTypes.SELECT,
            }
        );

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug} = req.params
    try {
        const documents = await sequelize.query(
            `SELECT *
            FROM chapters
            INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
            INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
            INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
            WHERE mainsubjects.slug = :mainsubjectslug
                AND categories.slug = :categoryslug
                AND subcategories.slug = :subcategoryslug
            ORDER BY chapters.chapterorder ASC`,
            {
                replacements: {
                    mainsubjectslug: mainsubjectslug,
                    categoryslug: categoryslug,
                    subcategoryslug: subcategoryslug,
                },
                type: QueryTypes.SELECT,
            }
        );

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters/:chapterslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug, chapterslug} = req.params
    try {
        const documents = await sequelize.query(
            `SELECT documents.title, documents.slug, documents.description
            FROM documents
            INNER JOIN chapters ON documents.chapterid = chapters.chapterid
            INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
            INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
            INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
            INNER JOIN uploads ON documents.documentid = uploads.documentid
            WHERE mainsubjects.slug = :mainsubjectslug
                AND categories.slug = :categoryslug
                AND subcategories.slug = :subcategoryslug
                AND chapters.slug = :chapterslug
                AND documents.accesslevel = 'Public'
                AND documents.status = 'Approved'
            ORDER BY uploads.uploaddate DESC
            LIMIT 15`,
            {
                replacements: {
                    mainsubjectslug: mainsubjectslug,
                    categoryslug: categoryslug,
                    subcategoryslug: subcategoryslug,
                    chapterslug: chapterslug,
                },
                type: QueryTypes.SELECT,
            }
        );

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters/:chapterslug/documents', identifyUser, async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug, chapterslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user
    try {
        // const documents = await sequelize.query(
        //     `SELECT documents.title, documents.slug, documents.description
        //     FROM documents
        //     INNER JOIN chapters ON documents.chapterid = chapters.chapterid
        //     INNER JOIN categories AS subcategories ON chapters.categoryid = subcategories.categoryid
        //     INNER JOIN categories ON subcategories.parentcategoryid = categories.categoryid
        //     INNER JOIN mainsubjects ON categories.mainsubjectId = mainsubjects.mainsubjectid
        //     INNER JOIN uploads ON documents.documentid = uploads.documentid
        //     WHERE mainsubjects.slug = :mainsubjectslug
        //         AND categories.slug = :categoryslug
        //         AND subcategories.slug = :subcategoryslug
        //         AND chapters.slug = :chapterslug
        //         AND documents.accesslevel = 'Public'
        //         AND documents.status = 'Approved'
        //     ORDER BY chapters.chapterorder ASC`,
        //     {
        //         replacements: {
        //             mainsubjectslug: mainsubjectslug,
        //             categoryslug: categoryslug,
        //             subcategoryslug: subcategoryslug,
        //             chapterslug: chapterslug,
        //         },
        //         type: QueryTypes.SELECT,
        //     }
        // );

        // res.status(200).json(documents);

        const { count, rows }  = await models.documents.findAndCountAll({
            where: {
                accesslevel: 'Public',
                status: 'Approved',
            },
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
                    where: {slug: chapterslug},
                    attributes: [],
                    order: [['chapterorder', 'ASC']],
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            where: {slug: subcategoryslug},
                            attributes: [],
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    where: {slug: categoryslug},
                                    attributes: [],
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                            where: {slug: mainsubjectslug},
                                            attributes: [],
                                        },
                                    ]
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

router.get('/:mainsubjectid/documents', identifyUser, async (req, res, next) => {
    const {mainsubjectid} = req.params
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
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: false,
                    where: { userid: user ? user.userid : null },
                }
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

router.get('/find-with-slug/:mainsubjectslug/categories/:categoryslug/category-info', async (req, res, next) => {
    const {mainsubjectslug, categoryslug} = req.params
    try {
        const category = await models.categories.findOne({
            where: {slug: categoryslug, parentcategoryid: null},
            include: [
                {
                    model: models.mainsubjects,
                    as: 'mainsubject',
                    required: true,
                    where: {slug: mainsubjectslug},
                    attributes: [],
                }
            ]
        });
        res.status(200).json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Error fetching category" });
    }
});

router.get('/find-with-slug/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/subcategory-info', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug} = req.params
    try {
        const subcategory = await models.categories.findOne({
            where: {slug: subcategoryslug},
            include: [
                {
                    model: models.categories,
                    as: 'parentcategory',
                    required: true,
                    where: {slug: categoryslug},
                    attributes: [],
                    include: [
                        {
                            model: models.mainsubjects,
                            as: 'mainsubject',
                            required: true,
                            where: {slug: mainsubjectslug},
                            attributes: [],
                        }
                    ]
                }
            ]
        });
        res.status(200).json(subcategory);
    } catch (error) {
        console.error("Error fetching subcategory:", error);
        res.status(500).json({ error: "Error fetching subcategory" });
    }
});

module.exports = router;