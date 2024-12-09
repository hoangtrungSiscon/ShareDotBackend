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

router.get('/invoices', async (req, res, next)=>{
    const {page = 1, limit = 10, status, sortby = 'createdat', sortorder = 'DESC'} = req.query
    try {
        whereClause = []
        if (status) {
            whereClause.push({ status: status })
        }
        const { count, rows } = await models.payments.findAndCountAll({
            where: whereClause,
            offset: (page - 1) * limit,
            limit: limit,
            order: [[sortby, sortorder]],
        })

        res.status(200).json({
            totalItems: count,
            invoices: rows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred. Cannot get invoices' });
    }
});

module.exports = router;