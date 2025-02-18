const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');
const PaypalOrder = require('../mongodb_schemas/paypal_order');

async function generateAccessToken() {
    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
        method: 'post',
        data: 'grant_type=client_credentials',
        auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_SECRET_KEY
        }
    })

    return response.data.access_token;
}

exports.createOrder = async (purchase_details) => {
    const accessToken = await generateAccessToken();

    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        data: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    items: [
                        {
                            name: purchase_details.name,
                            description: purchase_details.description,
                            quantity: purchase_details.quantity,
                            unit_amount: {
                                currency_code: 'USD',
                                value: purchase_details.price
                            }
                        }
                    ],
                    amount: {
                        currency_code: 'USD',
                        value: purchase_details.price,
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: purchase_details.price
                            }
                        }
                    }
                }
            ],
            application_context: {
                return_url: process.env.CLIENT_URL + '/payment-result',
                cancel_url: process.env.CLIENT_URL + '/payment-result',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'SHAREDOT'
            }
        })
    })

    const payment_info = await models.payments.create({
        userid: purchase_details.userid,
        amount: purchase_details.price,
        currency: 'USD',
        transactionid: response.data.id,
        status: 'Pending',
        description: 'Thanh toán ' + purchase_details.purchase_item_name,
        paymentmethod: 'Paypal',
    });

    await PaypalOrder.create({
        orderid: response.data.id,
        orderstatus: response.data.status,
        userid: purchase_details.userid,
        purchase_item_type: purchase_details.purchase_item_type,
        purchase_item_id: purchase_details.purchase_item_id,
    })

    return response.data.links.find(link => link.rel === 'approve').href
}

exports.getOrderDetails = async (orderID) => {
    const accessToken = await generateAccessToken();

    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderID}`,
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        }
    });

    return response.data;
};


exports.capturePayment = async (orderID) => {
    const accessToken = await generateAccessToken();

    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderID}/capture`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        }
    })

    return response.data
}