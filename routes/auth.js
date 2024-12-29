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
const { Op } = require('sequelize');

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
            where: { username: username, password: hashedPassword,
                [Op.or]: [
                    { isactive: 1 },
                    { isactive: 2 }
                ]
             },
            attributes: ['userid', 'username', 'role']
        });

        if (user) {
            const token = jwt.sign(
                { userid: user.userid },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ token: token, user: user });
        } else {
            res.status(403).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: 'An error occurred during login' });
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

router.post('/username/username-exists', async (req, res, next) => {
    const { username } = req.body;
    try {
        if (!username) {
            return res.status(400).json({ error: "username is required" });
        }

        const user = await models.users.findOne({
            where: { username: username }
        })
        res.json({ exists: !!user });
    } catch (error) {
        console.error("Error fetching document:", error);
        res.status(500).json({ error: "Error fetching document" });
    }
});

router.post('/email/email-exists', identifyUser, async (req, res, next) => {
    const { email } = req.body;
    const user = req.user;
    try {
        if (!email) {
            return res.status(400).json({ error: "username is required" });
        }

        if (user){
            const user_data = await models.users.findOne({
                where: { userid: user.userid },
                attributes: ['email']
            })

            if (user_data.email === email){
                return res.json({ exists: false });
            }
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
                tokenexpiry: new Date(Date.now() + 60 * 60 * 1000)
            });

            const resetLink = `${process.env.CLIENT_URL}/reset-pass?token=${token}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Đặt lại mật khẩu mới',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Đặt lại mật khẩu tài khoản Gmail của bạn</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td>
                                <table role="presentation" width="600" align="center" cellspacing="0" cellpadding="20" border="0" style="border: 1px solid #ddd; border-radius: 5px;">
                                    <tr>
                                        <td>
                                            <h2>Đặt lại mật khẩu tài khoản của bạn</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <p>Chào bạn,</p>
                                            <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấp vào liên kết bên dưới để tạo mật khẩu mới:</p>
                                            <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a></p>
                                            <p>Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không phải là người yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="text-align: right;">
                                            <p>Trân trọng,<br>
                                            Đội ngũ Share Dot</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error during forgot password:", error);
                    res.status(500).json({ error: 'An error occurred during forgot password' });
                } else {
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

router.get('/auth-guard/verify', authMiddleware, async (req, res) => {
    try {
        res.status(200).json(req.user);
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
    const user = req.user;
    try {
        const user_data = await models.users.findOne({
            where: { userid: user.userid },
            attributes: ['username', 'email', 'role', 'fullname', 'birthdate', 'point', 'school', 'description', 'avatarpath', 'createdat']
        })
        if (user_data) {
            if (user_data.avatarpath != null) {
                user_data.avatarpath = await getAvatarURL(user_data.avatarpath);
            }
            res.status(200).json(user_data);
        }
        else {
            res.status(404).json({ error: 'User data not found' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/get-user-data/:username', async(req, res) => {
    const {username} = req.params;
    try {
        const user_data = await models.users.findOne({
            where: { username: username },
            attributes: ['username', 'email', 'role', 'fullname', 'birthdate', 'point', 'school', 'description', 'avatarpath', 'createdat']
        })
        if (user_data) {
            if (user_data.avatarpath != null) {
                user_data.avatarpath = await getAvatarURL(user_data.avatarpath);
            }
            res.status(200).json(user_data);
        }
        else {
            res.status(404).json({ error: 'User data not found' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/owner-of-account/:username', identifyUser, async(req, res) => {
    const {username} = req.params;
    const user = req.user;
    try {
        if (!user){
            res.status(200).json(false);
        }
        else {
            const user_data = await models.users.findOne({
                where: { username: username },
                attributes: ['userid']
            })
            if (user_data) {
                if (user_data.userid === user.userid) {
                    res.status(200).json(true);
                }
                else {
                    res.status(200).json(false);
                }
            }
            else {
                res.status(404).json({ error: 'User data not found' });
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.put('/update-user-data', authMiddleware, upload.single('file'), async(req, res) => {
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