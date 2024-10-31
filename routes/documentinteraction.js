const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/documents/:documentid/record-view', authMiddleware, async (req, res, next) => {
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
        
        const incrementResult = await models.documents.increment('viewcount', { where: { documentid: documentid } });

        res.status(200).json({ message: 'View recorded successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/documents/:documentid/like', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        await models.documentinteractions.update(
            { isliked: true, likedate: new Date() },
            { where: { documentid: documentid, userid: user.userid } }
        )

        res.status(200).json({ message: 'Document liked successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/documents/:documentid/bookmark', authMiddleware, async (req, res, next) => {
    const { documentid } = req.params;
    const user = req.user;
    try {
        await models.documentinteractions.update(
            { isbookmarked: true, bookmarkdate: new Date() },
            { where: { documentid: documentid, userid: user.userid } }
        )

        res.status(200).json({ message: 'Document bookmarked successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

module.exports = router;