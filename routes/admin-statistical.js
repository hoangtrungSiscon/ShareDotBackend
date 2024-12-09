const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
require('dotenv').config();
const { Op, Sequelize, fn, col } = require('sequelize');
const { formatName } = require('../services/azureStorageService');
const moment = require('moment');

const models = initModels(sequelize);

router.get('/transactions', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        if (fromdate > todate) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.payments.findAll({
            where: {
                paymentdate: {
                    [Op.between]: [fromdataISO, todataISO],
                },
            },
            attributes: [
                'paymentid',
                'userid',
                'amount',
                'currency',
                'transactionid',
                'bank',
                'status',
                [fn('DATE', col('paymentdate')), 'paymentdate'],
                'description',
                'paymentmethod',
                'createdat',
            ],
            order: [['paymentdate', 'DESC']],
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/transaction-summary', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        if (fromdate > todate) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.payments.findAll({
            where: {
                paymentdate: {
                    [Op.between]: [fromdataISO, todataISO],
                },
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('amount')), 'paid_total'],
                // [sequelize.fn('COUNT', sequelize.col('paymentid')), 'count'],
                [sequelize.literal(`(SELECT COUNT(paymentid) FROM payments WHERE status = 'Paid' AND paymentdate BETWEEN '${fromdataISO}' AND '${todataISO}')`), 'paid_count'],
                [sequelize.literal(`(SELECT COUNT(paymentid) FROM payments WHERE status = 'Canceled' AND createdat BETWEEN '${fromdataISO}' AND '${todataISO}')`), 'canceled_count'],
            ],
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/transaction-chart-data', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        if (fromdate > todate) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.payments.findAll({
            where: {
                // paymentdate: {
                //     [Op.between]: [fromdataISO, todataISO],
                // },
                [Op.or]: [
                    {
                        paymentdate: {
                            [Op.between]: [fromdataISO, todataISO],
                        },
                    },
                    {
                        createdat: {
                            [Op.between]: [fromdataISO, todataISO],
                        },
                    },
                ],
            },
            attributes: [
                [fn('DATE', col('paymentdate')), 'payment_date'],
                [fn('DATE', col('createdat')), 'created_date'],

                [fn('COUNT', sequelize.literal(`CASE WHEN status = 'Paid' THEN 1 END`)), 'paid_count'],
                [fn('COUNT', sequelize.literal(`CASE WHEN status = 'Overdue' THEN 1 END`)), 'overdue_count'],
                [fn('COUNT', sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 END`)), 'pending_count'],
                [fn('COUNT', sequelize.literal(`CASE WHEN status = 'Canceled' THEN 1 END`)), 'canceled_count'],

                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Paid' THEN amount ELSE 0 END`)), 'paid_amount'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Overdue' THEN amount ELSE 0 END`)), 'overdue_amount'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Pending' THEN amount ELSE 0 END`)), 'pending_amount'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Canceled' THEN amount ELSE 0 END`)), 'canceled_amount'],
            ],
            group: [
                'payment_date',
                'created_date'
            ],
            order: [['created_date', 'ASC']],
            raw: true,
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/document-chart-data', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        if (fromdate > todate) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.uploads.findAll({
            where: {
                uploaddate: {
                    [Op.between]: [fromdataISO, todataISO],
                },
            },
            attributes: [
                [fn('DATE', col('uploaddate')), 'upload_date'],
                [fn('COUNT', col('uploadid')), 'upload_count'],
            ],
            group: [
                'upload_date'
            ],
            order: [['upload_date', 'ASC']],
            raw: true,
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

module.exports = router;