const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');
const {createOrder, capturePayment} = require('../services/paypalService');

router.get('/paypal/purchase-recharge-plan/:packid', authMiddleware, async (req, res, next)=>{
    const {packid} = req.params
    try {
        const plan = await models.rechargepacks.findOne({
            where: { packid: packid }
        })

        const purchase_details = {
            name: plan.packname,
            price: (plan.price - (plan.price * (plan.discount / 100))).toFixed(2),
            description: `Mua gói nạp "${plan.packname}"`,
            quantity: 1
        }

        const url = await createOrder(purchase_details)

        res.status(200).json({url:url})
    } catch (error) {
        console.log(error)
    }
});

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
        whereClause = [
            { paymentid: paymentid },
        ]
        if (user.role !== 'admin') {
            whereClause.push({ userid: user.userid })
        }
        const payment_info = await models.payments.findOne({
            where: whereClause,
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