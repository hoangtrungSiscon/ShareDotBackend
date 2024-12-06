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
// const { sql } = require('@sequelize/core');

router.get('/', identifyUser, async (req, res, next) => {
    const {mainsubjectid, categoryid, subcategoryid, chapterid, title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree // documents? sortby=title & sortorder=ASC
    } = req.query

    const user = req.user;
    try {
        whereClause = [
            {
                accesslevel: 'Public',
            },
            {
                status: 'Approved'
            }
        ]

        if (mainsubjectid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN
                    (SELECT categoryid FROM categories WHERE parentcategoryid IN
                    (SELECT categoryid FROM categories WHERE mainsubjectid = ${sequelize.escape(mainsubjectid)})))`)
            }});
        }
        if (categoryid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid IN (SELECT categoryid FROM categories WHERE parentcategoryid = ${categoryid}))`)
            }});
        }
        if (subcategoryid) {
            whereClause.push({chapterid : {
                [Op.in]: Sequelize.literal(`(SELECT chapterid FROM chapters WHERE categoryid = ${sequelize.escape(subcategoryid)})`)
            }});
        }
        if (chapterid) {
            whereClause.push({chapterid: chapterid});
        }
        

        if (filetypegroup){
            switch (filetypegroup) {
                case 'document':
                    whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
                    break;
                case 'spreadsheet':
                    whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
                    break;
                case 'image':
                    whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
                    break;
                case 'audio':
                    whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
                    break;
                case 'video':
                    whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
                    break;
                case 'presentation':
                    whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
                    break;
                default:
                    break;
            }
        }
        if (filesizerange){
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
        }
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }})
        }
        if (isfree === 'true') {
            whereClause.push({pointcost: { [Op.eq]: 0 }})
        } else if (isfree === 'false') {
            whereClause.push({pointcost: { [Op.ne]: 0 }})
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        const { count, rows }  = await models.documents.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    attributes: ['uploaddate', 'uploaderid'],
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
                    include: [
                        {
                            model: models.users,
                            as: 'uploader',
                            required: true,
                            attributes: ['fullname', 'userid']
                        }
                    ]
                },
                // {
                //     model: models.chapters,
                //     as: 'chapter',
                //     required: true,
                //     where: chapterid ? { chapterid: chapterid } : {},
                //     attributes: [],
                //     include: [
                //         {
                //             model: models.categories,
                //             as: 'category',
                //             required: true,
                //             where: subcategoryid ? { categoryid: subcategoryid } : {},
                //             attributes: [],
                //             include: [
                //                 {
                //                     model: models.categories,
                //                     as: 'parentcategory',
                //                     required: true,
                //                     where: categoryid ? { categoryid: categoryid } : {},
                //                     attributes: [],
                //                     include: [
                //                         {
                //                             model: models.mainsubjects,
                //                             as: 'mainsubject',
                //                             required: true,
                //                             where: mainsubjectid ? { mainsubjectid: mainsubjectid } : {},
                //                             attributes: [],
                //                         },
                //                     ]
                //                 }
                //             ]
                //         }
                //     ]
                // },
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
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
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.get('/owned-documents/:username', identifyUser, async (req, res, next) => {
    const user = req.user;
    const { page = 1, limit = 10, title, filetypegroup, filesizerange, sortby, sortorder = 'DESC', isfree } = req.query;
    const {username} = req.params
    try {
        const whereClause = [
            {
                status: 'Approved'
            }
        ];

        const targetUser = await models.users.findOne({
            where: { username: username },
            attributes: ['userid']
        })

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user){
            if (user.userid !== targetUser.userid) {
                whereClause.push({ accesslevel: 'Public' });
            }
        } else {
            whereClause.push({ accesslevel: 'Public' });
        }
        

        const { count, rows } = await models.uploads.findAndCountAll({
            duplicating: false,
            include: [
                {
                    model: models.documents,
                    as: 'document',
                    required: true,
                    duplicating: false,
                    where: whereClause,
                    attributes: {
                        exclude: ['filepath'],
                        include: [
                            [
                              Sequelize.literal(`
                                EXISTS (
                                  SELECT 1 FROM documentinteractions
                                  WHERE documentinteractions.documentid = document.documentid
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
                                  WHERE documentinteractions.documentid = document.documentid
                                  AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
                                  AND documentinteractions.isbookmarked = TRUE
                                )
                              `),
                              'isbookmarked',
                            ],
                        ],
                    },
                }
            ],
            where: {uploaderid: targetUser.userid},
            offset: (page - 1) * limit,
            limit: limit
        });
        res.setHeader('X-Total-Count', count);
        res.status(200).json({
            totalItems: count,
            uploads: rows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.get('/:documentid', async (req, res, next) => {
    const { documentid } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid, status: 'Approved' },
            attributes: { exclude: ['filepath'] },
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
            ]
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document.accesslevel === 'Private') {
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && (user.userid === document.uploads[0].uploaderid || user.role === 'admin')) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
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
        const document = await models.documents.findOne({
            where: { slug: slug, status: 'Approved' },
            attributes: { exclude: ['filepath'] },
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
            ]
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        if (document && document.accesslevel === 'Private') {
            return authMiddleware(req, res, async () => {
                const user = req.user;

                if (user && user.userid === document.uploads[0].uploaderid) {

                    return res.status(200).json( document);
                } else {
                    return res.status(403).json({ message: "Access denied" });
                }
            });
        }

        // Nếu tài liệu không phải private, trả về tài liệu mà không cần xác thực
        res.status(200).json(document);
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.post('/upload-document', authMiddleware, async (req, res, next) => {
    const user = req.user;
    const { title, description, filetype, filepath, filesize, chapterid } = req.body;
    try {
        const newDocument = await models.documents.create({
            title,
            description,
            filetype,
            filepath,
            filesize,
            chapterid
        })
        const newUpload = await models.uploads.create({
            documentid: newDocument.documentid,
            uploaderid: user.userid
        })
        res.status(201).json({ message: 'Document uploaded successfully' });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Error uploading document" });
    }
});

router.put('/:documentid/download', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const pointcost = await models.documents.findOne({
            where: { documentid: documentid },
            attributes: ['pointcost']
        });

        const remainingPoint = await models.users.findOne({
            where: { userid: user.userid },
            attributes: ['point']
        });

        if (remainingPoint.point < pointcost.pointcost) {
            return res.status(403).json({ message: 'Insufficient point' });
        }

        await models.users.increment({point: -pointcost.pointcost}, {where: {userid: user.userid}});
        res.status(200).json({ message: 'Document downloaded successfully' });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error downloading document" });
    }
});

router.get('/interacted/documents', authMiddleware, async (req, res, next) => {
    const {title, filetypegroup, filesizerange, page = 1, limit = 10,
        sortby, sortorder = 'DESC', isfree,
        hasLiked = false, hasBookmarked = false
    } = req.query

    const user = req.user;
    try {
        whereClause = [
            {
                accesslevel: 'Public'
            },
            {
                status: 'Approved'
            },
        ]

        if (filetypegroup){
            switch (filetypegroup) {
                case 'document':
                    whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
                    break;
                case 'spreadsheet':
                    whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
                    break;
                case 'image':
                    whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
                    break;
                case 'audio':
                    whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
                    break;
                case 'video':
                    whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
                    break;
                case 'presentation':
                    whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
                    break;
                default:
                    break;
            }
        }
        if (filesizerange){
            const [minSize, maxSize] = filesizerange.split('-');
            const minSizeMB = parseInt(minSize) * 1024 * 1024;
            const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
            whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
        }
        if (title) {
            whereClause.push({title: { [Op.iLike]: `%${title}%` }})
        }
        if (isfree === 'true') {
            whereClause.push({pointcost: { [Op.eq]: 0 }})
        } else if (isfree === 'false') {
            whereClause.push({pointcost: { [Op.ne]: 0 }})
        }

        const document_sort_order = [];
        const upload_sort_order = [];

        if (sortby) {
            if (['title', 'filesize', 'viewcount', 'likecount', 'pointcost'].includes(sortby)){
                document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }

            if (sortby === 'uploaddate'){
                upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
            }
        }

        interactionFilters = [{userid: user.userid}];

        if (hasLiked === 'true') {
            interactionFilters.push({isliked: true});
        }

        if (hasBookmarked === 'true') {
            interactionFilters.push({isbookmarked: true});
        }

        const { count, rows }  = await models.documents.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    duplicating: false,
                    order: upload_sort_order.length > 0 ? upload_sort_order : [],
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
                    model: models.documentinteractions,
                    as: 'documentinteractions',
                    required: true,
                    where: interactionFilters,
                }
            ],
            order: document_sort_order.length > 0 ? document_sort_order : [['documentid', 'DESC']],
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
        console.error("Error fetching documents:", error.message);
        res.status(500).json({ error: "Error fetching documents", error });
    }
});

router.put('/:documentid/change-access-level/:accesslevel', authMiddleware, async (req, res, next) => {
    const { documentid, accesslevel } = req.params;
    const { user } = req;
    try {
        if (!['Public', 'Private'].includes(accesslevel)){
            return res.status(400).json({ error: "Invalid access level" });
        }

        const upload = await models.uploads.findOne({
            where: {
                documentid: documentid,
                uploaderid: user.userid
            }
        });
        if (!upload) {
            return res.status(404).json({ error: "Error changing access level" });
        }

        const document = await models.documents.findOne({
            where: {
                documentid: documentid,
            }
        });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        document.accesslevel = accesslevel;
        await document.save();
        res.status(200).json({ message: 'Access level changed successfully' });
    } catch (error) {
        console.error("Error changing access level:", error);
        res.status(500).json({ error: "Error changing access level" });
    }
})

module.exports = router;