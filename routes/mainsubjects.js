const express = require('express');
const router = express.Router();
const { Op, Sequelize, fn, col, where, QueryTypes  } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const slugify = require('slugify');
const { formatName, createContainer } = require('../services/azureStorageService');
const Document = require('../mongodb_schemas/documents');


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

router.post('/add-new-mainsubject', authMiddleware, checkRoleMiddleware('admin'), async (req, res, next) => {
    const {mainsubjectname} = req.body
    try {
        const mainsubject = await models.mainsubjects.create({
            mainsubjectname: mainsubjectname,
            slug: formatName(mainsubjectname),
        });

        if (!mainsubject) {
            return res.status(500).json({ error: "Error adding new main subject" });
        }

        await createContainer(formatName(mainsubjectname));
        
        res.status(200).json({message: "New main subject added successfully."});
    } catch (error) {
        console.error("Error adding new main subject:", error);
        res.status(500).json({ error: "Error adding new main subject" });
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
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug} = req.params

    try {
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;

        const totalItems = await Document.countDocuments(query);
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .limit(15)
        .lean();

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug} = req.params

    try {
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;
        query.categoryid = category.categoryid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;

        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .limit(15)
        .lean();

        res.status(200).json(documents);
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/find-with-slug/:mainsubjectslug/categories/:categoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {mainsubjectslug, categoryslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user;

    try {
        const query = {};
        const sort = {};
        sort.uploaddate = -1;

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;
        query.categoryid = category.categoryid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .skip(skip)
        .sort(sort)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug} = req.params

    try {
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        const subcategory = await models.categories.findOne({
            where: {slug: subcategoryslug},
            attributes: ['categoryid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;
        query.categoryid = category.categoryid;
        query.subcategoryid = subcategory.categoryid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .limit(15)
        .lean();

        res.status(200).json(documents);
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug} = req.params
    try {
        const chapters = await sequelize.query(
            `SELECT chapters.chapterid, chapters.slug, chapters.chapterorder, chapters.chaptername, chapters.description, chapters.categoryid
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

        res.status(200).json(chapters);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters/:chapterslug/top-recent-documents', async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug, chapterslug} = req.params

    try {
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        const subcategory = await models.categories.findOne({
            where: {slug: subcategoryslug},
            attributes: ['categoryid']
        })

        const chapter = await models.chapters.findOne({
            where: {slug: chapterslug},
            attributes: ['chapterid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;
        query.categoryid = category.categoryid;
        query.subcategoryid = subcategory.categoryid;
        query.chapterid = chapter.chapterid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;

        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .limit(15)
        .lean();

        res.status(200).json(documents);
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
});

router.get('/:mainsubjectslug/categories/:categoryslug/subcategories/:subcategoryslug/chapters/:chapterslug/documents', identifyUser, async (req, res, next) => {
    const {mainsubjectslug, categoryslug, subcategoryslug, chapterslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user

    try {
        const query = {};
        const sort = {};

        const mainsubject = await models.mainsubjects.findOne({
            where: {slug: mainsubjectslug},
            attributes: ['mainsubjectid']
        })

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        const subcategory = await models.categories.findOne({
            where: {slug: subcategoryslug},
            attributes: ['categoryid']
        })

        const chapter = await models.chapters.findOne({
            where: {slug: chapterslug},
            attributes: ['chapterid']
        })

        query.mainsubjectid = mainsubject.mainsubjectid;
        query.categoryid = category.categoryid;
        query.subcategoryid = subcategory.categoryid;
        query.chapterid = chapter.chapterid;

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1

        sort.uploaddate = -1;

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const totalItems = await Document.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        const currentPage = Math.max(1, pageNumber > totalPages ? totalPages : pageNumber);

        const skip = (currentPage - 1) * pageSize;
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        const interactionData = await models.documentinteractions.findAll({
            attributes: ['documentid', 'isliked', 'isbookmarked'],
            where: {
                userid: user ? user.userid : null
            },
            raw: true
        })

        const interactionMap = interactionData.reduce((map, interaction) => {
            map[interaction.documentid] = {
                isliked: interaction.isliked || false,
                isbookmarked: interaction.isbookmarked || false,
            };
            return map;
        }, {});


        documents.forEach(doc => {
            const interaction = interactionMap[doc.documentid.toString()] || {};
            doc.isliked = interaction.isliked || false;
            doc.isbookmarked = interaction.isbookmarked || false;
        });

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: currentPage,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
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

        if (!mainsubject){
            return res.status(404).json({ error: "Main subject not found" });
        }

        if (categoryname === '') {
            return res.status(400).json({ error: "Category name is required" });
        }

        const [category, created] = await models.categories.findOrCreate({
            where: {categoryname: categoryname},
            defaults: {
                categoryname: categoryname,
                parentcategoryid: null,
                mainsubjectid: mainsubject.mainsubjectid,
                slug: formatName(categoryname),
            }
        })

        if (category && subcategoryname) {
            const [subcategory, created] = await models.categories.findOrCreate({
                where: {categoryname: subcategoryname},
                defaults: {
                    categoryname: subcategoryname,
                    parentcategoryid: category.categoryid,
                    mainsubjectid: mainsubject.mainsubjectid,
                    slug: formatName(subcategoryname),
                }
            })

            if (chaptername !== '' && chapterorder !== '') {
                const [chapter, created] = await models.chapters.findOrCreate({
                    where: {chaptername: chaptername, chapterorder: chapterorder},
                    defaults: {
                        chaptername: chaptername,
                        chapterorder: chapterorder,
                        categoryid: subcategory.categoryid,
                        slug: formatName(`chuong ${chapterorder} ${chaptername}`),
                    }
                })
                if (!created){
                    return res.status(400).json({ error: "Chapter already exists" });
                }
            }
            else {
                return res.status(400).json({ error: "Chapter name and order is required" });
            }
        }
        
        
        res.status(200).json({message: "Data added successfully."});
    } catch (error) {
        console.error("Error adding data:", error);
        res.status(500).json(error);
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