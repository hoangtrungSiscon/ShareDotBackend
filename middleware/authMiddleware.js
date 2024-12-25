const jwt = require('jsonwebtoken');

const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const authMiddleware = async(req, res, next) => {
    const token = req.header('Authorization')?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await models.users.findOne({
            where: { userid: decoded.userid, isactive: 1 },
            attributes: ['userid', 'role', 'fullname', 'username']
        });
        if (!user) return res.status(401).json({ message: "Invalid token" });

        req.user = user; // Lưu thông tin id và role vào req
        next();
    } catch (error) {
        console.error("Token verification error:", error); 
        res.status(401).json({ message: "Invalid token" });
    }
};

const identifyUser = async(req, res, next) => {
    const token = req.header('Authorization')?.split(" ")[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await models.users.findOne({
                where: { userid: decoded.userid },
                attributes: ['userid', 'role']
            });
            req.user = user;
        } catch (error) {
            console.warn("Invalid token:", error.message);
        }
    }

    next();

};

module.exports = { authMiddleware, identifyUser };
