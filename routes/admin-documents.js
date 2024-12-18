const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const { formatName} = require('../services/azureStorageService');
const { Op, Sequelize } = require('sequelize');
const { authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const Document = require('../mongodb_schemas/documents');

router.get('/', async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
    } = req.query

    const user = req.user;
    
    try {
        const query = {};
        const sort = {};

        query.isactive = 1

        if (mainsubjectid) {
            query.mainsubjectid = mainsubjectid;
        }
        if (categoryid) {
            query.categoryid = categoryid;
        }
        if (subcategoryid) {
            query.subcategoryid = subcategoryid;
        }
        if (chapterid) {
            query.chapterid = chapterid;
        }

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (isfree === 'true') {
            query.pointcost = 0;
        } else if (isfree === 'false') {
            query.pointcost = { $ne: 0 };
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.uploaddate = -1; // Sắp xếp mặc định
        }

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/status/:status', async (req, res, next) => {
    const {title, filetypegroup, filesizerange, page = 1, limit = 5,
        sortby, sortorder = 'DESC'
    } = req.query

    const { status } = req.params;
    
    try {
        const query = {};
        const sort = {};

        query.isactive = 1
        query.status = status;

        // Lọc theo filetypegroup
        if (filetypegroup) {
            const filetypeGroups = {
                document: ['pdf', 'doc', 'docx', 'txt'],
                spreadsheet: ['xls', 'xlsx', 'csv'],
                image: ['jpg', 'jpeg', 'png'],
                audio: ['wav', 'mp3'],
                video: ['mp4', 'avi', 'mov', 'mkv'],
                presentation: ['ppt', 'pptx'],
            };
            query.filetype = { $in: filetypeGroups[filetypegroup] || [] };
        }

        // Lọc theo filesize
        if (filesizerange) {
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            query.filesize = { $gte: minSizeMB, $lte: maxSizeMB };
        }

        if (title) {
            query.title = { $regex: title, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
        }

        if (sortby) {
            const sortableFields = ['title', 'filesize', 'viewcount', 'likecount', 'pointcost', 'uploaddate'];
            if (sortableFields.includes(sortby)) {
                sort[sortby] = sortorder === 'ASC' ? 1 : -1;
            }
        } else {
            sort.uploaddate = 1;
        }

        // Phân trang
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        const totalItems = await Document.countDocuments(query);
        const documents = await Document.find(query)
        .select('-filepath')
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

        res.status(200).json({
            totalItems: totalItems,
            documents: documents,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;
    // try {
    //     const document = await models.documents.findOne({
    //         where: { documentid: documentid },
    //         attributes: { exclude: ['filepath'] },
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 duplicating: false,
    //                 include: [
    //                     {
    //                         model: models.users,
    //                         as: 'uploader',
    //                         required: true,
    //                         attributes: ['fullname', 'userid']
    //                     }
    //                 ]
    //             },
    //             {
    //                 model: models.chapters,
    //                 as: 'chapter',
    //                 required: true,
    //                 include: [
    //                     {
    //                         model: models.categories,
    //                         as: 'category',
    //                         required: true,
    //                         include: [
    //                             {
    //                                 model: models.categories,
    //                                 as: 'parentcategory',
    //                                 required: true,
    //                                 include: [
    //                                     {
    //                                         model: models.mainsubjects,
    //                                         as: 'mainsubject',
    //                                         required: true,
    //                                     }
    //                                 ]
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             }
    //         ]
    //     });

    //     if (!document) {
    //         return res.status(404).json({ error: "Document not found" });
    //     }
    //     res.status(200).json(document);
    // }

    try {
        const query = {};

        query.documentid = documentid
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.status(200).json(document);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.put('/:documentid/update-point', async (req, res, next) => {
    const { documentid } = req.params;
    const { pointcost } = req.body;
    try {
        const query = {};

        query.documentid = documentid
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        document.pointcost = pointcost;
        await document.save();

        await models.documents.update({ pointcost: pointcost }, { where: { documentid: documentid, isactive: 1 } });

        res.status(200).json({ message: 'Point cost updated successfully' });
    }
    catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Error updating document" });
    }
});

router.post('/title/title-exists', async (req, res, next) => {
    const { title } = req.body;
    try {
        const possibleSlug = formatName(title);
        const document = await models.documents.findOne({
            where: { slug: possibleSlug}
        })
        res.json({ exists: !!document });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/slug/:slug', async (req, res, next) => {
    const { slug } = req.params;
    
    try {
        const query = {};

        query.slug = slug
        query.isactive = 1


        const document = await Document.findOne(query)
        .select('-filepath')
        .lean();

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json(document);
    }
    catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.put('/:documentid/change-status/:status', async (req, res, next) => {
    const { documentid, status } = req.params;
    try {
        if (['Pending', 'Approved', 'Rejected'].includes(status) === false) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await models.documents.update(
            { status },
            { where: { documentid: documentid } }
        );

        await Document.findOneAndUpdate(
            {documentid: documentid},
            { status: status}
        )
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.get('/migrate/copy', async (req, res, next) => {
    try {
        const documents = await models.documents.findAll({
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid', 'username']
                        }
                    ]
                },
                {
                    model: models.chapters,
                    as: 'chapter',
                    required: true,
                    include: [
                        {
                            model: models.categories,
                            as: 'category',
                            required: true,
                            include: [
                                {
                                    model: models.categories,
                                    as: 'parentcategory',
                                    required: true,
                                    include: [
                                        {
                                            model: models.mainsubjects,
                                            as: 'mainsubject',
                                            required: true,
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
        });

        for (const document of documents) {
            await Document.create({
                title: document.title,
                documentid: document.documentid,
                mainsubjectid: document.chapter.category.parentcategory.mainsubject.mainsubjectid,
                mainsubjectname: document.chapter.category.parentcategory.mainsubject.mainsubjectname,
                categoryid: document.chapter.category.parentcategory.categoryid,
                categoryname: document.chapter.category.parentcategory.categoryname,
                subcategoryid: document.chapter.category.categoryid,
                subcategoryname: document.chapter.category.categoryname,
                chapterid: document.chapter.chapterid,
                chaptername: document.chapter.chaptername,
                filetype: document.filetype,
                filesize: document.filesize,
                accesslevel: document.accesslevel,
                status: document.status,
                viewcount: document.viewcount,
                pointcost: document.pointcost,
                description: document.description,
                uploaddate: document.uploads[0].uploaddate,
                filepath: document.filepath,
                uploaderid: document.uploads[0].uploaderid,
                uploadername: document.uploads[0].uploader.fullname,
                isactive: document.isactive,
                slug: document.slug,
                uploaderusername: document.uploads[0].uploader.username
            });
        }

        res.status(200).json({message: 'OK desu'})
    } catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
})

router.get('/mongoose/get-all', async (req, res, next) => {
    try {
        const documents = await Document.find()
        res.status(200).json(documents)
    } catch (error) {
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
})

module.exports = router;