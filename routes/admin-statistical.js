const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
require('dotenv').config();
const { Op, Sequelize, fn, col, where } = require('sequelize');
const { formatName } = require('../services/azureStorageService');
const moment = require('moment');
const Document = require('../mongodb_schemas/documents');

const models = initModels(sequelize);

router.get('/transactions', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use MM-DD-YYYY.' });
        }

        if (moment(fromdate, 'MM-DD-YYYY').isAfter(moment(todate, 'MM-DD-YYYY'))) {
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

router.get('/users-summary', async (req, res) => {
    try {
        const users = await models.users.findAll({
            attributes: [
                [fn('COUNT', sequelize.literal(`CASE WHEN isactive = 1 THEN 1 END`)), 'user_active'],
                [fn('COUNT', sequelize.literal(`CASE WHEN isactive = 0 THEN 1 END`)), 'user_lock'],
                [fn('COUNT', sequelize.literal(`CASE WHEN isactive = 2 THEN 1 END`)), 'user_warning'],
            ],
        });

        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/transactions-summary', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use MM-DD-YYYY.' });
        }

        if (moment(fromdate, 'MM-DD-YYYY').isAfter(moment(todate, 'MM-DD-YYYY'))) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.payments.findAll({
            where: {
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
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Paid' THEN amount ELSE 0 END`)), 'paid'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Overdue' THEN amount ELSE 0 END`)), 'overdue'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Pending' THEN amount ELSE 0 END`)), 'pending'],
                [fn('SUM', sequelize.literal(`CASE WHEN status = 'Canceled' THEN amount ELSE 0 END`)), 'canceled'],
            ],
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/transactions-total', async (req, res) => {
    try {
        const data = await models.payments.findAll({
            attributes: [
                [fn('SUM', col('amount')), 'paid_total'],
            ],
            where: {
                status: 'Paid',
            }
        });
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/transactions-details', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use MM-DD-YYYY.' });
        }

        if (moment(fromdate, 'MM-DD-YYYY').isAfter(moment(todate, 'MM-DD-YYYY'))) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        // Truy vấn tất cả giao dịch trong khoảng thời gian
        const transactions = await models.payments.findAll({
            where: {
                [Op.or]: [
                    {
                        status: 'Paid',
                        paymentdate: {
                            [Op.between]: [fromdataISO, todataISO],
                        },
                    },
                    {
                        status: {
                            [Op.ne]: 'Paid',
                        },
                        createdat: {
                            [Op.between]: [fromdataISO, todataISO],
                        },
                    },
                ],
            },
            attributes: ['transactionid', 'status', 'amount', 'paymentdate', 'createdat'],
            raw: true,
            order: [['createdat', 'ASC']],
        });

        // Tổ chức dữ liệu theo ngày
        const transactionStats = transactions.reduce((acc, transaction) => {
            const date = transaction.status === 'Paid'
                ? moment(transaction.paymentdate).format('YYYY-MM-DD')
                : moment(transaction.createdat).format('YYYY-MM-DD');

            let statusText = ''

            switch (transaction.status) {
                case 'Paid':
                    statusText = 'Hoàn thành';
                    break;
                case 'Pending':
                    statusText = 'Chưa hoàn thành';
                    break;
                case 'Overdue':
                    statusText = 'Quá hạn';
                    break;
                case 'Canceled':
                    statusText = 'Đã hủy';
                    break;
                default:
                    statusText = 'Chưa hoàn thành';
                    break;
            }

            const transactionData = {
                id: transaction.transactionid,
                status: transaction.status = statusText,
                amount: transaction.amount,
                paymentdate: transaction.paymentdate,
                createdat: transaction.createdat
            };

            // Kiểm tra xem ngày đã tồn tại trong acc chưa
            const existingDate = acc.find(item => item.date === date);
            if (existingDate) {
                existingDate.transactions.push(transactionData); // Thêm giao dịch vào ngày đã tồn tại
            } else {
                // Nếu chưa có, tạo mới
                acc.push({
                    date: date,
                    transactions: [transactionData], // Khởi tạo mảng giao dịch
                });
            }
            return acc;
        }, []);


        // Tạo danh sách ngày trong khoảng từ fromdate đến todate
        const dateRange = [];
        const startDate = moment(fromdataISO);
        const endDate = moment(todataISO);

        for (let m = startDate.clone(); m.isSameOrBefore(endDate); m.add(1, 'days')) {
            dateRange.push(m.format('YYYY-MM-DD'));
        }

        // Tạo kết quả cuối cùng với upload_count = 0 cho những ngày không có upload
        const result = dateRange.map(date => {
            const found = transactionStats.find(data => data.date === date);
            return {
                date: date,
                transactions: found ? found.transactions : [],
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/top-upload-users', async (req, res) => {
    try {
        const data = await models.users.findAll({
            include: [
                {
                    model: models.uploads,
                    as: 'uploads',
                    required: true,
                    attributes: [
                        // [fn('COUNT', col('uploadid')), 'upload_count'],
                    ],
                    include: [
                        {
                            model: models.documents,
                            as: 'document',
                            required: true,
                            where: { isactive: 1},
                            attributes: []
                        }
                    ],
                    order: [['upload_count', 'DESC']],
                }
            ],
            attributes: [
                'username',
                'userid',
                'fullname',
                [fn('COUNT', col('uploads.uploadid')), 'upload_count'],
            ],
            group: ['username', 'userid', 'fullname'],
            raw: true,
        });

        const parsedData = data.map(item => ({
            ...item,
            upload_count: parseInt(item.upload_count, 10) || 0, // Chuyển đổi và xử lý trường hợp NaN
        }));
        

        const sortedData = parsedData.sort((a, b) => b.upload_count - a.upload_count);

        const top3Users = sortedData.slice(0, 3);

        res.status(200).json(top3Users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve top users.' });
    }
})

router.get('/transaction-chart-data', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use MM-DD-YYYY.' });
        }

        if (moment(fromdate, 'MM-DD-YYYY').isAfter(moment(todate, 'MM-DD-YYYY'))) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const transactions = await models.payments.findAll({
            where: {
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

router.get('/top-viewed-documents', async (req, res) => {
    try {
        const data = await Document.find(
            {
                isactive: 1,
                status: 'Approved',
                accesslevel: 'Public'
            },
        )
        .select('-filepath')
        .sort({ viewcount: -1 })
        .limit(3)
        .lean();

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve top viewed documents.' });
    }
})

router.get('/top-liked-documents', async (req, res) => {
    try {
        const data = await Document.find(
            {
                isactive: 1,
                status: 'Approved',
                accesslevel: 'Public'
            },
        )
        .select('-filepath')
        .sort({ likecount: -1 })
        .limit(3)
        .lean();

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve top viewed documents.' });
    }
})

router.get('/document-chart-data', async (req, res) => {
    const { fromdate, todate } = req.query;
    try {
        if (!fromdate || !todate) {
            return res.status(400).json({ error: 'Must specify fromdate and todate' });
        }

        // Kiểm tra định dạng ngày
        if (!moment(fromdate, 'MM-DD-YYYY', true).isValid() || !moment(todate, 'MM-DD-YYYY', true).isValid()) {
            return res.status(400).json({ error: 'Invalid date format. Use MM-DD-YYYY.' });
        }

        if (moment(fromdate, 'MM-DD-YYYY').isAfter(moment(todate, 'MM-DD-YYYY'))) {
            return res.status(400).json({ error: 'fromdate must be before todate' });
        }

        const fromdataISO = moment(fromdate, 'MM-DD-YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todataISO = moment(todate, 'MM-DD-YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const uploads = await models.uploads.findAll({
            where: {
                uploaddate: {
                    [Op.between]: [fromdataISO, todataISO],
                },
            },
            include: [
                {
                    model: models.documents,
                    as: 'document',
                    required: true,
                    attributes: [],
                    where: { isactive: 1}
                }
            ],
            attributes: [
                [fn('DATE', col('uploaddate')), 'date'],
                [fn('COUNT', col('uploadid')), 'count'],
            ],
            group: [
                'date'
            ],
            order: [['date', 'ASC']],
            raw: true,
        });

        // Tạo danh sách ngày trong khoảng từ fromdate đến todate
        const dateRange = [];
        const startDate = moment(fromdataISO);
        const endDate = moment(todataISO);

        for (let m = startDate.clone(); m.isSameOrBefore(endDate); m.add(1, 'days')) {
            dateRange.push(m.format('YYYY-MM-DD'));
        }

        // Tạo kết quả cuối cùng với upload_count = 0 cho những ngày không có upload
        const result = dateRange.map(date => {
            const found = uploads.find(upload => upload.date === date);
            return {
                date: date,
                count: found ? parseInt(found.count) : 0,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

router.get('/documents-total', async (req, res) => {
    try {
        const data = await Document.countDocuments(
            { isactive: 1}
        )

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Could not retrieve transactions.' });
    }
});

module.exports = router;