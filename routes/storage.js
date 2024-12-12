const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const { getBlobURL, uploadBlob, formatName, deleteBlob } = require('../services/azureStorageService');
const multer = require('multer');
const upload = multer();
const path = require('path');
const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert');
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const Document = require('../mongodb_schemas/documents');

router.get('/documents/:documentid/url', identifyUser, async (req, res) => {
    const { documentid } = req.params;
    try {
        // decide if it's private later
        const document = await models.documents.findOne({
            where: { documentid: documentid,
                status: 'Approved',
                isactive: 1
            },
            attributes: {
                exclude: ['filepath']
            },
        })
        const blobURL = await getBlobURL(document.filepath);
        res.status(200).json({ url: blobURL });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
    }
});

router.get('/documents/slug/:slug/url', identifyUser, async (req, res) => {
    const { slug } = req.params;
    try {
        // decide if it's private later
        const document = await models.documents.findOne({
            where: { slug: slug, status: 'Approved', isactive: 1 },
        })
        const blobURL = await getBlobURL(document.filepath);
        res.status(200).json({ url: blobURL });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
    }
});

router.get('/documents/:documentid/download-url', async (req, res) => {
    const { documentid } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid, status: 'Approved', isactive: 1 },
        })
        const blobURL = await getBlobURL(document.filepath, 10);
        res.status(200).json({ url: blobURL });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
    }
});

router.post('/upload-document', authMiddleware, upload.single('file'),  async (req, res) => {
    const { title, description, accesslevel, filetype, filesize, chapterid, categoryid, subcategoryid, mainsubjectid } = req.body;
    const user = req.user;
    try {
        if (!req.file) return res.status(400).json({ message: 'No file!' });

        const possibleSlug = formatName(title);

        const documents = await models.documents.findAll({
            where: { slug: possibleSlug }
        });

        if (documents.length > 0) {
            return res.status(400).json({ message: 'Conflict with title' });
        }

        const data = await models.chapters.findOne({
            where: { chapterid: chapterid },
            // attributes: ['chaptername'],
            include: [
                {
                    model: models.categories,
                    as: 'category',
                    required: true,
                    where: { categoryid: subcategoryid },
                    include: [
                        {
                            model: models.categories,
                            as: 'parentcategory',
                            required: true,
                            where: { categoryid: categoryid, parentcategoryid: null },
                            include: [
                                {
                                    model: models.mainsubjects,
                                    as: 'mainsubject',
                                    required: true,
                                    where: { mainsubjectid: mainsubjectid },
                                }
                            ]
                        }
                    ]
                }
            ]
        })

        if (!data) {
            return res.status(404).json({ error: 'Wrong structure' });
        }

        const filepath = formatName(data.category.parentcategory.mainsubject.mainsubjectname)
        + '/' + formatName(data.category.parentcategory.categoryname)
        + '/' + formatName(data.category.categoryname)
        + '/' + formatName(data.chaptername);

        console.log(filepath);
        const storageFilePath = await uploadBlob(filepath, req.file.buffer, req.file.originalname);

        const extension = path.extname(req.file.originalname).replace('.', '');

        const document = await models.documents.create({
            title: title,
            description: description,
            filetype: extension,
            filepath: storageFilePath,
            filesize: filesize,
            chapterid: chapterid,
            accesslevel: accesslevel,
            status: 'Pending',
            slug: formatName(title)
        });

        const newUpload = await models.uploads.create({
            documentid: document.documentid,
            uploaderid: user.userid
        })

        const document_detail = await models.documents.findOne({
            where: { documentid: document.documentid },
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

        await Document.create({
            title: document_detail.title,
            documentid: document_detail.documentid,
            mainsubjectid: document_detail.chapter.category.parentcategory.mainsubject.mainsubjectid,
            mainsubjectname: document_detail.chapter.category.parentcategory.mainsubject.mainsubjectname,
            categoryid: document_detail.chapter.category.parentcategory.categoryid,
            categoryname: document_detail.chapter.category.parentcategory.categoryname,
            subcategoryid: document_detail.chapter.category.categoryid,
            subcategoryname: document_detail.chapter.category.categoryname,
            chapterid: document_detail.chapter.chapterid,
            chaptername: document_detail.chapter.chaptername,
            filetype: document_detail.filetype,
            filesize: document_detail.filesize,
            accesslevel: document_detail.accesslevel,
            status: document_detail.status,
            viewcount: document_detail.viewcount,
            pointcost: document_detail.pointcost,
            description: document_detail.description,
            uploaddate: document_detail.uploads[0].uploaddate,
            filepath: document_detail.filepath,
            uploaderid: document_detail.uploads[0].uploaderid,
            uploadername: document_detail.uploads[0].uploader.fullname,
            isactive: document_detail.isactive,
            slug: document_detail.slug,
            uploaderusername: document_detail.uploads[0].uploader.username
        });

        res.status(200).json({ message: 'Document uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
        console.log(error);
    }
});

router.delete('/documents/:documentid', authMiddleware, async (req, res) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid },
            include: [
                {
                    model: models.uploads,
                    as: 'uploader',
                    required: true,
                    where: { uploaderid: user.userid }
                }
            ],
            attributes: ['filepath']
        })
        await deleteBlob(document.filepath);

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Could not delete file.' });
        console.log(error);
    }
});

module.exports = router;
