const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');

const Document = require('../mongodb_schemas/documents');


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

router.get('/find-with-slug/:categoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {categoryslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user;

    try {
        const query = {};
        const sort = {};

        sort.uploaddate = -1;

        const category = await models.categories.findOne({
            where: {slug: categoryslug},
            attributes: ['categoryid']
        })

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        query.categoryid = category.categoryid

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

router.get('/find-with-slug/subcategories/:subcategoryslug/all-documents', identifyUser, async (req, res, next) => {
    const {subcategoryslug} = req.params
    const {page = 1, limit = 10} = req.query
    const user = req.user;

    try {
        const query = {};
        const sort = {};

        sort.uploaddate = -1;

        const subcategory = await models.categories.findOne({
            where: {slug: subcategoryslug},
            attributes: ['categoryid']
        })

        if (!subcategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        query.subcategoryid = subcategory.categoryid

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

module.exports = router;