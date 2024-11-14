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

module.exports = router;