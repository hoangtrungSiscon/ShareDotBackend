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
            where: { userid: decoded.id },
            attributes: ['userid', 'role']
        });
        if (!user) return res.status(401).json({ message: "Invalid token" });

        req.user = user; // Lưu thông tin id và role vào req
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
