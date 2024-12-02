const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
require('dotenv').config();
const { Op, Sequelize } = require('sequelize');
const { formatName } = require('../services/azureStorageService');

const models = initModels(sequelize);

function hashSHA256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

router.get('/all-payments', async (req, res) => {
    try {
        const payments = await models.payments.findAll();
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Could not retrieve payments.' });
    }
});

module.exports = router;