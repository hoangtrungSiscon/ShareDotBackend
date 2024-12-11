const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const Document = require('../mongodb_schemas/documents');

router.get('/:chapterid', async (req, res, next) => {
    const {chapterid} = req.params
    try {
        const chapters = await models.chapters.findOne({
            where: {chapterid:chapterid},
        });
        res.status(200).json(chapters);
    } catch (error) {
        console.error("Error fetching chapter", error);
        res.status(500).json({ error: "Error fetching chapter" });
    }
});

router.get('/find-with-slug/:slug', async (req, res, next) => {
    const {slug} = req.params
    try {
        const chapter = await models.chapters.findOne({
            where: {slug: slug},
        });
        res.status(200).json(chapter);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Error fetching category" });
    }
});

router.get('/:chapterid/documents', identifyUser, async (req, res, next) => {
    const {page = 1, limit = 10, sortby, sortorder = 'DESC', isfree, title, filetypegroup, filesizerange} = req.query
    const {chapterid} = req.params

    const user = req.user;

    // try {
    //     const document_sort_order = [];
    //     const upload_sort_order = [];

    //     whereClause = [
    //         {
    //             chapterid: chapterid
    //         },
    //         {
    //             accesslevel: 'Public'
    //         },
    //         {
    //             status: 'Approved'
    //         },
            
    //     ]
    //     if (title) {
    //         whereClause.push({title: { [Op.iLike]: `%${title}%` }});
    //     }
    //     if (filetypegroup){
    //         switch (filetypegroup) {
    //             case 'document':
    //                 whereClause.push({filetype: { [Op.any]: ['pdf', 'doc', 'docx', 'txt']}});
    //                 break;
    //             case 'spreadsheet':
    //                 whereClause.push({filetype: { [Op.any]: ['xls', 'xlsx', 'csv'] }});
    //                 break;
    //             case 'image':
    //                 whereClause.push({filetype: { [Op.any]: ['jpg', 'jpeg', 'png'] }});
    //                 break;
    //             case 'audio':
    //                 whereClause.push({filetype: { [Op.any]: ['wav', 'mp3'] }});
    //                 break;
    //             case 'video':
    //                 whereClause.push({filetype: { [Op.any]: ['mp4', 'avi', 'mov', 'mkv'] }});
    //                 break;
    //             case 'presentation':
    //                 whereClause.push({filetype: { [Op.any]: ['ppt', 'pptx'] }});
    //                 break;
    //             default:
    //                 break;
    //         }
    //     }
    //     if (filesizerange){
    //         const [minSize, maxSize] = filesizerange.split('-');
    //         const minSizeMB = parseInt(minSize) * 1024 * 1024;
    //         const maxSizeMB = parseInt(maxSize) * 1024 * 1024;
    //         whereClause.push({filesize: { [Op.between]: [minSizeMB, maxSizeMB] }});
    //     }
    //     if (isfree === 'true') {
    //         whereClause.push({pointcost: { [Op.eq]: 0 }});
    //     } else if (isfree === 'false') {
    //         whereClause.push({pointcost: { [Op.ne]: 0 }});
    //     }

    //     if (sortby) {
    //         if (['title', 'viewcount', 'likecount'].includes(sortby)){
    //             document_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //         }

    //         if (sortby === 'uploaddate'){
    //             upload_sort_order.push([sortby, sortorder === 'ASC' ? 'ASC' : 'DESC']);
    //         }
    //     }

    //     const { count, rows } = await models.documents.findAndCountAll({
    //         where: whereClause,
    //         order: document_sort_order.length > 0 ? document_sort_order : [],
    //         include: [
    //             {
    //                 model: models.uploads,
    //                 as: 'uploads',
    //                 required: true,
    //                 duplicating: false,
    //                 order: upload_sort_order.length > 0 ? upload_sort_order : [],
    //                 include: [
    //                     {
    //                         model: models.users,
    //                         as: 'uploader',
    //                         required: true,
    //                         attributes: ['fullname', 'userid']
    //                     }
    //                 ]
    //             },
    //         ],
    //         attributes: {
    //             exclude: ['filepath'],
    //             include: [
    //                 [
    //                   Sequelize.literal(`
    //                     EXISTS (
    //                       SELECT 1 FROM documentinteractions
    //                       WHERE documentinteractions.documentid = documents.documentid
    //                       AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
    //                       AND documentinteractions.isliked = TRUE
    //                     )
    //                   `),
    //                   'isliked',
    //                 ],
    //                 [
    //                   Sequelize.literal(`
    //                     EXISTS (
    //                       SELECT 1 FROM documentinteractions
    //                       WHERE documentinteractions.documentid = documents.documentid
    //                       AND documentinteractions.userid = ${user ? user.userid : 'NULL'}
    //                       AND documentinteractions.isbookmarked = TRUE
    //                     )
    //                   `),
    //                   'isbookmarked',
    //                 ],
    //             ],
    //         },
    //         offset: (page - 1) * limit,
    //         limit: limit
    //     });
    //     res.status(200).json({
    //         totalItems: count,  // Tổng số tài liệu
    //         documents: rows,  // Tài liệu của trang hiện tại
    //         currentPage: parseInt(page),
    //         totalPages: Math.ceil(count / limit)
    //     });
    // }
    try {
        const query = {}; // Truy vấn động
        const sort = {}; // Định nghĩa sắp xếp

        query.accesslevel = 'Public';
        query.status = 'Approved';
        query.isactive = 1
        query.chapterid = chapterid

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
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Error fetching documents" });
    }
})
module.exports = router;