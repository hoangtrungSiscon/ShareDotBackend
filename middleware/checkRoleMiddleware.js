const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

// checkRole.js
const hasRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!requiredRole.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }

        next();
    };
};

const IsAdmin = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!['admin_system', 'admin_user', 'admin_document', 'admin_invoice'].includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }

        next();
    };
};

module.exports = {hasRole, IsAdmin};