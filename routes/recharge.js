const axios = require('axios');
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);
const { authMiddleware, identifyUser } = require('../middleware/authMiddleware');

router.get('/plans', async (req, res, next)=>{
    try {
        const packs = await models.rechargepacks.findAll()

        const updatedPacks = packs.map(pack => {
            const data = pack.dataValues;

            const price = parseFloat(data.price);
            const discount = parseFloat(data.discount);

            const final_price = (price - (price * (discount / 100))).toFixed(2);

            return {
                ...data,
                final_price
            };
          });

        res.status(200).json(updatedPacks)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred. Cannot get packs data' });
    }
});

module.exports = router;