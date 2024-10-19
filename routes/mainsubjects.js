const express = require('express');
const router = express.Router();


const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

router.get('/mainsubject', async (req, res, next) => {
    try {
        const mainsubjects = await models.mainsubjects.findAll();
        res.status(200).json(mainsubjects);
    } catch (error) {
        console.error("Error fetching mainsubjects:", error);
        res.status(500).json({ error: "Error fetching mainsubjects" });
    }
});

module.exports = router;