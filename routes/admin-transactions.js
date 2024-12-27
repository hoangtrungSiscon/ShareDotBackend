const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const { Op, Sequelize } = require('sequelize');
const { formatName } = require('../services/azureStorageService');
const moment = require('moment');

const models = initModels(sequelize);

router.get('/', async (req, res) => {
    const { sortby = 'timestamp', sortorder = 'DESC', page = 1, limit = 10, searchstring } = req.query;
    try {
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);

        const fromdate = moment().subtract(1, 'weeks').startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const todate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

        let whereClause = [{
            timestamp: {
                [Op.between]: [fromdate, todate],
            }
        }];

        if (searchstring) {
            whereClause.push({description: { [Op.iLike]: `%${searchstring}%` }});
        }

        const { count: totalItems, rows: transactions } = await models.transactions.findAndCountAll({
            where: whereClause,
            offset: (pageNumber - 1) * pageSize,
            limit: limit,
            order: [[sortby, sortorder]]
        });

        res.status(200).json({
            totalItems: totalItems,
            transactions: transactions,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalItems / pageSize),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

module.exports = router;