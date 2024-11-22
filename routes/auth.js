const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const crypto = require('crypto');
require('dotenv').config();
const nodemailer = require('nodemailer');
const {authMiddleware, identifyUser} = require('../middleware/authMiddleware');
const { getBlobURL, uploadBlob, formatName, uploadAvatar, getAvatarURL } = require('../services/azureStorageService');
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

  

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = hashSHA256(password);

    try {
        const user = await models.users.findOne({
            where: { username: username, password: hashedPassword },
            attributes: ['userid']
        });

        if (user) {
            const token = jwt.sign(
                { userid: user.userid },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.json({ token });
        } else {
            res.status(403).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: 'An error occurred during login' });
    }

});

router.post('/register', async (req, res, next) => {
    const { username, password, email, role, fullname, birthdate } = req.body;
    const hashedPassword = hashSHA256(password);

    try {
        const newUser = await models.users.create({
            username,
            password: hashedPassword,
            email,
            role,
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

router.post('/reset-password-request', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await models.users.findOne({
            where: { email: email },
            attributes: ['userid']
        });
        if (user) {
            console.log(user)
            const token = crypto.randomBytes(32).toString('hex');
            const hashedToken = hashSHA256(token);

            await models.passwordresettokens.create({
                userid: user.userid,
                token: hashedToken,
                tokenexpiry: new Date(Date.now() + 10 * 60 * 1000)
            });

            const resetLink = `${process.env.CLIENT_URL}/reset-pass?token=${token}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Đặt lại mật khẩu mới',
                html: `<p>Hãy nhấn vào đây và thực hiện việc đặt lại mật khẩu mới: <a href="http://${resetLink}">Đặt lại mật khẩu mới</a></p>
                
                <p>Đường dẫn này sẽ có hiệu lực trong vòng 10 phút.</p>`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error during forgot password:", error);
                    res.status(500).json({ error: 'An error occurred during forgot password' });
                } else {
                    console.log('Email sent: ' + info.response);
                    res.status(200).json({ message: 'Email sent successfully' });
                }
            });
        }
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.post('/verify-reset-password-token', async (req, res) => {
    const { token } = req.body;
    try {
        const hashedToken = hashSHA256(token);
        const passwordResetToken = await models.passwordresettokens.findOne({
            where: { token: hashedToken },
            attributes: ['tokenexpiry']
        });
        if (!passwordResetToken) {
            return res.status(400).json({ error: 'Invalid token' });
        }
        const now = new Date();
        if (now > passwordResetToken.tokenexpiry) {
            return res.status(400).json({ error: 'Expired token' });
        }
        res.status(200).json({ message: 'Valid token' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
})

router.post('/verify-token', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({ message: 'Valid token' });
    } catch (error) {
        res.status(500).json({ error: 'Invalid token' });
    }
})

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

router.get('/get-user-data', authMiddleware, async(req, res) => {
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

router.put('/update-user-data', authMiddleware, upload.single('file'), async(req, res) => {
    const userid = req.user.userid;
    const { username, email, fullname, birthdate, school, description } = req.body;
    try {
        if (req.file){
            const avatarpath = await uploadAvatar(req.file.buffer, req.file.originalname);

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

router.put('/update-password', authMiddleware, async(req, res) => {
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