const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');

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

exports.createOrder = async () => {
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
                            name: 'Point of sharedot',
                            description: 'point of sharedot to buy things',
                            quantity: 1,
                            unit_amount: {
                                currency_code: 'USD',
                                value: '99.23'
                            }
                        }
                    ],
                    amount: {
                        currency_code: 'USD',
                        value: '99.23',
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: '99.23'
                            }
                        }
                    }
                }
            ],
            application_context: {
                return_url: process.env.SITE_BASE_URL + '/order-completed',
                cancel_url: process.env.SITE_BASE_URL + '/order-canceled',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'SHAREDOT'
            }
        })
    })

    return response.data.links.find(link => link.rel === 'approve').href
}

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

this.createOrder().then(result => console.log(result))