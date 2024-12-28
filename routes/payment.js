const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');
const {createOrder, capturePayment, getOrderDetails} = require('../services/paypalService');
const PaypalOrder = require('../mongodb_schemas/paypal_order');

router.get('/paypal/purchase-recharge-plan/:packid', authMiddleware, async (req, res, next)=>{
    const {packid} = req.params
    const user = req.user
    try {
        const plan = await models.rechargepacks.findOne({
            where: { packid: packid }
        })

        const purchase_details = {
            name: plan.packname,
            price: (plan.price - (plan.price * (plan.discount / 100))).toFixed(2),
            description: `Mua gói nạp "${plan.packname}"`,
            quantity: 1,
            userid: user.userid,
            purchase_item_id: plan.packid,
            purchase_item_type: 'rechargepack',
            purchase_item_name: plan.packname
        }

        const url = await createOrder(purchase_details)

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã tạo đơn hàng mua gói nạp "${plan.packname}"`,
        })

        res.status(200).json({url:url})
    } catch (error) {
        console.log(error)
    }
});


router.post('/paypal/capture-order', authMiddleware, async (req, res) => {
    const { orderID } = req.body;
    const user = req.user
    if (!orderID) {
        return res.status(400).json({ success: false, message: 'Order ID is missing' });
    }

    try {
        // Lấy thông tin chi tiết Order
        const orderDetails = await getOrderDetails(orderID);

        // Kiểm tra trạng thái Order
        if (orderDetails.status === 'COMPLETED') {
            const order_db = await PaypalOrder.findOneAndUpdate(
                {orderid: orderID, userid: user.userid},
                { orderstatus: 'COMPLETED' },
                { new: true }
            )

            const pack = await models.rechargepacks.findOne({
                where: { packid: order_db.purchase_item_id }
            });
    
            const [payment_info, created] = await models.payments.findOrCreate({
                where: { transactionid: orderID },
                defaults: {
                    userid: order_db.userid,
                    amount: orderDetails.purchase_units[0].amount.value,
                    currency: orderDetails.purchase_units[0].amount.currency_code,
                    transactionid: orderID,
                    status: 'Paid',
                    description: 'Thanh toán ' + pack.packname,
                    paymentmethod: 'Paypal',
                },
            });

            if (!created){
                payment_info.status = 'Paid'
                await payment_info.save()
            }
            const pointtransactions = await models.pointtransactions.create({
                userid: order_db.userid,
                amount: pack.point,
                type: 'payment',
                source: 'Paypal',
                description: 'Thanh toán ' + pack.packname
            });

            console.log(pointtransactions)

            const user = await models.users.findOne({
                where: {userid: order_db.userid},
            })

            user.point += pack.point
            await user.save()

            await models.transactions.create({
                userid: user.userid,
                description: `${user.username} đã thanh toán cho gói nạp "${pack.packname}"`,
            })

            return res.status(200).json({ 
                success: true, 
                message: 'Payment has already been completed'
            });
        }

        if (orderDetails.status === 'APPROVED') {
            // Nếu Order đã được phê duyệt, thực hiện capture
            const captureResponse = await capturePayment(orderID);

            await PaypalOrder.findOneAndUpdate(
                {orderid: orderID},
                { orderstatus: 'COMPLETED' },
            )

            const order_db = await PaypalOrder.findOne({
                orderid: orderID
            }).lean();

            const pack = await models.rechargepacks.findOne({
                where: { packid: order_db.purchase_item_id }
            });
    
            const [payment_info, created] = await models.payments.findOrCreate({
                where: { transactionid: orderID },
                defaults: {
                    userid: order_db.userid,
                    amount: orderDetails.purchase_units[0].amount.value,
                    currency: orderDetails.purchase_units[0].amount.currency_code,
                    transactionid: orderID,
                    status: 'Paid',
                    description: 'Thanh toán ' + pack.packname,
                    paymentmethod: 'Paypal',
                },
            });

            if (!created){
                payment_info.status = 'Paid'
                await payment_info.save()
            }
            const pointtransactions = await models.pointtransactions.create({
                userid: order_db.userid,
                amount: pack.point,
                type: 'payment',
                source: 'Paypal',
                description: 'Thanh toán ' + pack.packname
            });

            console.log(pointtransactions)

            const user = await models.users.findOne({
                where: {userid: order_db.userid},
            })

            user.point += pack.point
            await user.save()

            await models.transactions.create({
                userid: user.userid,
                description: `${user.username} đã thanh toán cho gói nạp "${pack.packname}"`,
            })

            return res.status(200).json({ 
                success: true, 
                message: 'Payment captured successfully', 
                data: captureResponse 
            });
        }

        // Các trạng thái khác (nếu có)
        return res.status(400).json({ 
            success: false, 
            message: `Order is in status: ${orderDetails.status}`, 
            data: orderDetails 
        });

    } catch (error) {
        console.error('Error handling order return:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while processing the payment', 
            error: error.response?.data || error.message || error 
        });
    }
});

router.post('/paypal/pay-order', authMiddleware, async (req, res) => {
    const { orderID } = req.body;
    const user = req.user
    try {
        if (!orderID) {
            return res.status(400).json({ success: false, message: 'Order ID is missing' });
        }

        const order = await models.payments.findOne({
            where: { transactionid: orderID, userid: user.userid, status: 'Pending', paymentmethod: 'Paypal' }
        })

        if (!order) {
            return res.status(400).json({ success: false, message: 'Order not found' });
        }

        const orderDetails = await getOrderDetails(orderID);

        if (orderDetails.status === 'COMPLETED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment has already been completed'
            });
        }

        if (orderDetails.status === 'APPROVED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment has already been approved'
            });
        }

        const approvalLink = orderDetails.links.find(link => link.rel === 'approve');
        if (!approvalLink) {
            throw new Error('Approval link not found for this order');
        }

        res.status(200).json({url: approvalLink.href});
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'An error occurred while processing the payment' });
    }
})

router.post('/paypal/cancel-order', authMiddleware, async (req, res) => {
    const { orderID } = req.body;
    const user = req.user
    try {
        if (!orderID) {
            return res.status(400).json({ success: false, message: 'Order ID is missing' });
        }

        const order = await models.payments.findOne({
            where: { transactionid: orderID, userid: user.userid, status: 'Pending' }
        })

        if (!order) {
            return res.status(400).json({ success: false, message: 'Order not found' });
        }

        await PaypalOrder.findOneAndUpdate(
            {orderid: orderID},
            { orderstatus: 'VOIDED' },
        )

        order.status = 'Canceled'
        await order.save()

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã hủy thanh toán cho giao dịch có mã "${order.transactionid}"`,
        })

        return res.status(200).json({ success: true, message: 'Order voided successfully' }); 
    } catch (error) {
        
    }
})


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