const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');
const {createOrder, capturePayment} = require('../services/paypalService');

router.post('/paypal/create-order', async (req, res, next)=>{
    try {
        const url = await createOrder()

        res.status(200).json({url:url})
    } catch (error) {
        console.log(error)
    }
});

router.post('/paypal/capture-order', async (req, res, next)=>{
    const {orderID} = req.body
    try {
        const response = await capturePayment(orderID)
        res.status(200).json({success:true, data:response})
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Lỗi  thanh toán qua Paypal', error });
    }
});

router.get('/invoices', authMiddleware, async (req, res, next)=>{
    const user = req.user
    const {page = 1, limit = 10, status, sortby = 'createdat', sortorder = 'DESC'} = req.query
    try {
        whereClause = [
            { userid: user.userid },
        ]
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

router.get('/invoices/:paymentid', authMiddleware, async (req, res, next)=>{
    const user = req.user
    const {paymentid} = req.params
    try {
        const payment_info = await models.payments.findOne({
            where: { userid: user.userid, paymentid: paymentid },
            include: [
                {
                    model: models.users,
                    as: 'user',
                    attributes: ['fullname', 'email', 'userid']
                }
            ]
        })

        res.status(200).json(payment_info)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred. Cannot get invoices' });
    }
});

module.exports = router;