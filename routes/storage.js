const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { where } = require('sequelize');
const models = initModels(sequelize);
const { getBlobURL } = require('../config/azureBlobStorage');

router.get('/documents/:documentid/url', async (req, res) => {
    const { documentid } = req.params;
    try {
        const document = await models.documents.findOne({
            where: { documentid: documentid },
        })
        const blobURL = await getBlobURL(document.filepath);
        res.status(200).json({ url: blobURL });
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve file.' });
    }
});

module.exports = router;
