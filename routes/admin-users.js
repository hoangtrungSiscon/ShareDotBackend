const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const crypto = require('crypto');
require('dotenv').config();
const { Op, Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware');
const { formatName, uploadAvatar, getAvatarURL } = require('../services/azureStorageService');
const multer = require('multer');
const upload = multer();

const models = initModels(sequelize);

function hashSHA256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.get('/', async (req, res, next) => {
    const { page = 1, limit = 10, role, status, username, sortby = 'userid', sortorder = 'DESC'} = req.query;
    try {
        whereClause = []
        if (role) {
            whereClause.push({ role: role })
        }

        if (username) {
            whereClause.push({ username: { [Op.iLike]: `%${username}%` } })
        }

        if (status) {
            whereClause.push({ isactive: status })
        }

        const { count, rows } = await models.users.findAndCountAll({
            attributes: {
                exclude: ['password'],
            },
            offset: (page - 1) * limit,
            limit: limit,
            order: [[sortby, sortorder]],
            where: whereClause
        });
        res.status(200).json({
            totalItems: count,
            users: rows,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error });
    }

});

router.post('/register', async (req, res, next) => {
    const { username, password, email, fullname, birthdate } = req.body;
    const hashedPassword = hashSHA256(password);

    try {
        const newUser = await models.users.create({
            username,
            password: hashedPassword,
            email,
            fullname,
            birthdate,
            point: 1000
        });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: error.message });
    }

});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const hashedToken = hashSHA256(token);
        const user = await models.passwordresettokens.findOne({
            where: { token: hashedToken },
            attributes: ['userid']
        });
        if (user) {
            const hashedPassword = hashSHA256(password);
            await models.users.update(
                { password: hashedPassword },
                { where: { userid: user.userid } }
            );
            await models.passwordresettokens.destroy(
                { where: { userid: user.userid } }
            );
            res.status(200).json({ message: 'Password reset successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/get-user-data', async(req, res) => {
    const userid = req.user.userid;
    const user_data = await models.users.findOne({
        where: { userid: userid },
        attributes: ['username', 'email', 'role', 'fullname', 'birthdate', 'point', 'school', 'description', 'avatarpath', 'createdat']
    })
    if (user_data) {
        if (user_data.avatarpath != null) {
            user_data.avatarpath = await getAvatarURL(user_data.avatarpath);
            // user_data.avatarpath = 'asdas'
        }
        res.status(200).json( user_data);
    }
    else {
        res.status(404).json({ error: 'User data not found' });
    }
});

router.put('/update-user-data', upload.single('file'), async(req, res) => {
    const userid = req.user.userid;
    const { username, email, fullname, birthdate, school, description } = req.body;
    try {
        if (req.file){
            const userdata = await models.users.findOne({
                where: { userid: userid },
                attributes: ['avatarpath']
            })

            const avatarpath = await uploadAvatar(req.file.buffer, req.file.originalname, userdata.avatarpath);

            await models.users.update(
                { username: username, email: email, fullname: fullname, birthdate : birthdate, school : school, description: description,
                    avatarpath: avatarpath
                 },
                { where: { userid: userid } }
            );

            res.status(200).json({ message: 'User data updated successfully' });
        }
        else {
            await models.users.update(
                { username: username, email: email, fullname: fullname, birthdate : birthdate, school : school, description: description },
                { where: { userid: userid } }
            );

            res.status(200).json({ message: 'User data updated successfully' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.put('/update-password', async(req, res) => {
    const userid = req.user.userid;
    const { oldPassword, newPassword } = req.body;

    const user = await models.users.findOne({
        where: { userid: userid, password: hashSHA256(oldPassword) },
        attributes: ['userid']
    });

    if (!user) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    const hashedNewPassword = hashSHA256(newPassword);
    try {
        await models.users.update(
            { password: hashedNewPassword },
            { where: { userid: userid } }
        );
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

module.exports = router;