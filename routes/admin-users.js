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
    const { page = 1, limit = 10, role, status, username, sortby = 'username', sortorder = 'ASC'} = req.query;
    const user = req.user;
    try {
        whereClause = [
            { userid: { [Op.ne]: user.userid } }
        ]
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
    const { username, password, email, fullname, birthdate, role } = req.body;
    const hashedPassword = hashSHA256(password);

    const user = req.user;
    try {
        const newUser = await models.users.create({
            username: username,
            password: hashedPassword,
            email: email,
            fullname: fullname,
            birthdate: birthdate,
            role: role,
            point: 1000
        });

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã tạo tài khoản mới ${newUser.username}`,
        })

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: error.message });
    }

});

router.post('/email/email-exists', async (req, res, next) => {
    const { email } = req.body;
    const user = req.user;
    try {
        if (!email) {
            return res.status(400).json({ error: "username is required" });
        }

        const data = await models.users.findOne({
            where: { email: email }
        })

        res.json({ exists: !!data });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
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

router.get('/:userid', async(req, res) => {
    const { userid } = req.params;
    try {
        const user = await models.users.findOne({
            where: { userid: userid },
            attributes: {
                exclude: ['password'],
                include: [
                    [
                        Sequelize.literal(`
                            (
                            SELECT SUM(viewcount)
                            FROM documents
                            INNER JOIN uploads ON documents.documentid = uploads.documentid
                            WHERE uploads.uploaderid = ${sequelize.escape(userid)}
                            )
                        `),
                        'viewcount',
                    ],
                    [
                    Sequelize.literal(`
                        (
                          SELECT SUM(likecount)
                          FROM documents
                          INNER JOIN uploads ON documents.documentid = uploads.documentid
                          WHERE uploads.uploaderid = ${sequelize.escape(userid)}
                        )
                      `),
                      'likecount',
                    ],

                    [
                        Sequelize.literal(`
                            (
                              SELECT COUNT(1)
                              FROM uploads
                              WHERE uploads.uploaderid = ${sequelize.escape(userid)}
                            )
                        `),
                        'uploadcount',
                    ],
                ],
            }
        });
        if (user) {
            if (user.avatarpath != null) {
                user.avatarpath = await getAvatarURL(user.avatarpath);
            }
            res.status(200).json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.put('/:userid/set-role/:role', async (req, res, next) => {
    const { userid, role } = req.params;
    const user = req.user;
    try {
        if (!['admin_user', 'admin_document', 'admin_invoice', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await models.users.update(
            { role: role },
            { where: { userid: userid } }
        );

        const data = await models.users.findOne({
            where: { userid: userid },
            attributes: ['username', 'role']
        })

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã đổi quyền cho người dùng ${data.username} thành ${data.role}`,
        })

        res.status(200).json({ message: 'User role updated successfully' });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.put('/:userid/set-user-status/:status', async (req, res, next) => {
    const { userid, status } = req.params;
    const user = req.user;
    try {
        if (!['Lock', 'Active', 'Warning'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        let status_code = 0;

        switch (status) {
            case 'Lock':
                status_code = 0;
                break;
            case 'Active':
                status_code = 1;
                break;
            case 'Warning':
                status_code = 2;
                break;
        }

        await models.users.update(
            { isactive: status_code },
            { where: { userid: userid } }
        );

        const data = await models.users.findOne({
            where: { userid: userid },
            attributes: ['username']
        })

        await models.transactions.create({
            userid: user.userid,
            description: `${user.username} đã đổi trạng thái người dùng ${data.username} thành ${status}`,
        })

        res.status(200).json({ message: 'User role updated successfully' });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

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