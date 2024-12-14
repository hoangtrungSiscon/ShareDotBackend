const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');
const {createOrder, capturePayment, verifyWebhookSignature, getOrderDetails} = require('../services/paypalService');
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
        }

        const url = await createOrder(purchase_details)

        res.status(200).json({url:url})
    } catch (error) {
        console.log(error)
    }
});

// router.post('/paypal/create-order', async (req, res, next)=>{
//     try {
//         const url = await createOrder()

//         res.status(200).json({url:url})
//     } catch (error) {
//         console.log(error)
//     }
// });

// router.post('/paypal/capture-order', async (req, res) => {
//     const { orderID } = req.body;

//     if (!orderID) {
//         return res.status(400).json({ success: false, message: 'Order ID is required' });
//     }

//     try {
//         const orderDetails = await getOrderDetails(orderID);

//         // Kiểm tra trạng thái Order
//         if (orderDetails.status !== 'APPROVED') {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Order is not ready for capture', 
//                 status: orderDetails.status 
//             });
//         }

//         const captureResponse = await capturePayment(orderID);
//         res.status(200).json({ success: true, data: captureResponse });
//     } catch (error) {
//         console.error('Error Capturing Order:', error.response?.data || error.message || error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Failed to capture payment', 
//             error: error.response?.data || error.message || error 
//         });
//     }
// });


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
            
            if (created) {
                await models.pointtransactions.create({
                    userid: order_db.userid,
                    amount: pack.point,
                    transactiontype: 'payment',
                    description: 'Thanh toán ' + pack.packname
                });
            }

            const user = await models.users.findOne({
                where: {userid: order_db.userid},
            })

            user.point += pack.point
            await user.save()

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

            if (created) {
                await models.pointtransactions.create({
                    userid: order_db.userid,
                    amount: pack.point,
                    transactiontype: 'payment',
                    description: 'Thanh toán ' + pack.packname
                });
            }

            const user = await models.users.findOne({
                where: {userid: order_db.userid},
            })

            user.point += pack.point
            await user.save()

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


router.post('/paypal/webhook', async (req, res) => {
    const headers = req.headers;
    const body = req.rawBody;
    const webhookEvent = req.body;

    const isValid = await verifyWebhookSignature(headers, body);

    if (!isValid) {
        return res.status(400).json({ success: false, message: 'Webhook verification failed' });
    }

    if (webhookEvent.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const captureID = webhookEvent.resource.id; // ID của giao dịch
        const orderID = webhookEvent.resource.supplementary_data.related_ids.order_id; // Order ID
        const customId = webhookEvent.resource.purchase_units[0].custom_id;
        const [userId, packId] = customId.split('-');

        // Ghi nhận giao dịch vào hệ thống
        await models.pointtransactions.create({
            // orderId: orderID,
            // captureId: captureID,
            // status: 'completed',
            // amount: webhookEvent.resource.amount.value,
            // currency: webhookEvent.resource.amount.currency_code,
            // userId: webhookEvent.resource.payer.payer_info.first_name

            userid: userId,
            amount: webhookEvent.resource.purchase_units[0].amount.value,
            transactiontype: 'payment',
            transactiondate: webhookEvent.event_time,
            source: 'Paypal',
            transactiondate: new Date(),
            description: 'Thanh toán gói nạp ' + packId
        });

        await models.payments.create({
            // orderId: orderID,
            // captureId: captureID,
            // status: 'completed',
            // amount: webhookEvent.resource.amount.value,
            // currency: webhookEvent.resource.amount.currency_code,
            // userId: webhookEvent.resource.payer.payer_info.first_name

            userid: userId,
            amount: webhookEvent.resource.purchase_units[0].amount.value,
            currency: webhookEvent.resource.purchase_units[0].amount.currency_code,
            transactionid: webhookEvent.resource.id,
            status: 'Paid',
            description: 'Thanh toán gói nạp ' + packId,
            paymentmethod: 'Paypal',
        });

        res.status(200).send();
    }

    // Xử lý sự kiện webhook ở đây
    console.log('Webhook event:', JSON.parse(body));
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
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