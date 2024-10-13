const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

// checkRole.js
const checkRoleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }

        next();
    };
};

module.exports = checkRoleMiddleware;