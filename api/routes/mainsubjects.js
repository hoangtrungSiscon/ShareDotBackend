const express = require('express');
const router = express.Router();
const pool = require('../../config/db')

const mainSubject = require('../../models/mainsubjects');


router.get('/', (req, res, next) => {
    pool.query('SELECT * FROM mainsubjects;', (err, result) => {
        res.status(200).json(result.rows)
    })
})

module.exports = router;