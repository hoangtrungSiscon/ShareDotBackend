const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const { Op } = require('sequelize');
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const Document = require('../mongodb_schemas/documents');

router.get('/documents/:documentid/status', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const [record, created] = await models.documentinteractions.findOrCreate({
            where: { documentid: documentid, userid: user.userid },
            defaults: {
                documentid: documentid,
                userid: user.userid
            }
        })

        res.status(200).json(record);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/documents/:documentid/increase-view', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const [record, created] = await models.documentinteractions.findOrCreate({
            where: { documentid: documentid, userid: user.userid },
            defaults: {
                documentid: documentid,
                userid: user.userid
            }
        })
        
        await models.documents.increment('viewcount', { where: { documentid: documentid } });

        await Document.findOneAndUpdate(
            {documentid: documentid},
            { $inc: { viewcount: 1 } }
        )

        res.status(200).json(record);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/documents/:documentid/like', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const [record, created ] = await models.documentinteractions.findOrCreate({
            where: { documentid: documentid, userid: user.userid },
            defaults: {
                documentid: documentid,
                userid: user.userid
            }
        });

        if (!record.isliked) {
            await models.documentinteractions.update(
                { isliked: true, likedate: new Date() },
                { where: { documentid: documentid, userid: user.userid } }
            )

            await models.documents.increment('likecount', { where: { documentid: documentid } });

            await Document.findOneAndUpdate(
                {documentid: documentid},
                { $inc: { likecount: 1 } }
            )

            return res.status(200).json({ message: 'Document liked successfully' });
        }
        else {
            await models.documentinteractions.update(
                { isliked: false, likedate: null },
                { where: { documentid: documentid, userid: user.userid } }
            )

            await models.documents.decrement('likecount', { where: { documentid: documentid } });

            const document = await Document.findOne(
                {documentid: documentid},
            )

            if (document.likecount > 0) {
                document.likecount = document.likecount - 1;
            }
             
            await document.save();

            return res.status(200).json({ message: 'Document unliked successfully' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/documents/:documentid/bookmark', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        const [record, created] = await models.documentinteractions.findOrCreate({
            where: { documentid: documentid, userid: user.userid },
            defaults: {
                documentid: documentid,
                userid: user.userid
            }
        });

        if (!record.isbookmarked) {
            await models.documentinteractions.update(
                { isbookmarked: true, bookmarkdate: new Date() },
                { where: { documentid: documentid, userid: user.userid } }
            )

            return res.status(200).json({ message: 'Document bookmarked successfully' });
        }
        else {
            await models.documentinteractions.update(
                { isbookmarked: false, bookmarkdate: null },
                { where: { documentid: documentid, userid: user.userid } }
            )

            return res.status(200).json({ message: 'Document unbookmarked successfully' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

module.exports = router;