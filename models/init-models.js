var DataTypes = require("sequelize").DataTypes;
var _categories = require("./categories");
var _chapters = require("./chapters");
var _companies = require("./companies");
var _documentinteractions = require("./documentinteractions");
var _documents = require("./documents");
var _mainsubjects = require("./mainsubjects");
var _passwordresettokens = require("./passwordresettokens");
var _payments = require("./payments");
var _pointtransactions = require("./pointtransactions");
var _promotions = require("./promotions");
var _rechargepacks = require("./rechargepacks");
var _transactions = require("./transactions");
var _uploads = require("./uploads");
var _users = require("./users");
var _vouchers = require("./vouchers");
var _voucherusage = require("./voucherusage");

function initModels(sequelize) {
  var categories = _categories(sequelize, DataTypes);
  var chapters = _chapters(sequelize, DataTypes);
  var companies = _companies(sequelize, DataTypes);
  var documentinteractions = _documentinteractions(sequelize, DataTypes);
  var documents = _documents(sequelize, DataTypes);
  var mainsubjects = _mainsubjects(sequelize, DataTypes);
  var passwordresettokens = _passwordresettokens(sequelize, DataTypes);
  var payments = _payments(sequelize, DataTypes);
  var pointtransactions = _pointtransactions(sequelize, DataTypes);
  var promotions = _promotions(sequelize, DataTypes);
  var rechargepacks = _rechargepacks(sequelize, DataTypes);
  var transactions = _transactions(sequelize, DataTypes);
  var uploads = _uploads(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var vouchers = _vouchers(sequelize, DataTypes);
  var voucherusage = _voucherusage(sequelize, DataTypes);

  categories.belongsTo(categories, { as: "parentcategory", foreignKey: "parentcategoryid"});
  categories.hasMany(categories, { as: "categories", foreignKey: "parentcategoryid"});
  chapters.belongsTo(categories, { as: "category", foreignKey: "categoryid"});
  categories.hasMany(chapters, { as: "chapters", foreignKey: "categoryid"});
  documents.belongsTo(chapters, { as: "chapter", foreignKey: "chapterid"});
  chapters.hasMany(documents, { as: "documents", foreignKey: "chapterid"});
  promotions.belongsTo(companies, { as: "company", foreignKey: "companyid"});
  companies.hasMany(promotions, { as: "promotions", foreignKey: "companyid"});
  documentinteractions.belongsTo(documents, { as: "document", foreignKey: "documentid"});
  documents.hasMany(documentinteractions, { as: "documentinteractions", foreignKey: "documentid"});
  uploads.belongsTo(documents, { as: "document", foreignKey: "documentid"});
  documents.hasMany(uploads, { as: "uploads", foreignKey: "documentid"});
  categories.belongsTo(mainsubjects, { as: "mainsubject", foreignKey: "mainsubjectid"});
  mainsubjects.hasMany(categories, { as: "categories", foreignKey: "mainsubjectid"});
  vouchers.belongsTo(promotions, { as: "promotion", foreignKey: "promotionid"});
  promotions.hasMany(vouchers, { as: "vouchers", foreignKey: "promotionid"});
  documentinteractions.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(documentinteractions, { as: "documentinteractions", foreignKey: "userid"});
  passwordresettokens.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(passwordresettokens, { as: "passwordresettokens", foreignKey: "userid"});
  payments.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(payments, { as: "payments", foreignKey: "userid"});
  pointtransactions.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(pointtransactions, { as: "pointtransactions", foreignKey: "userid"});
  transactions.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(transactions, { as: "transactions", foreignKey: "userid"});
  uploads.belongsTo(users, { as: "uploader", foreignKey: "uploaderid"});
  users.hasMany(uploads, { as: "uploads", foreignKey: "uploaderid"});
  voucherusage.belongsTo(users, { as: "user", foreignKey: "userid"});
  users.hasMany(voucherusage, { as: "voucherusages", foreignKey: "userid"});
  voucherusage.belongsTo(vouchers, { as: "voucher", foreignKey: "voucherid"});
  vouchers.hasMany(voucherusage, { as: "voucherusages", foreignKey: "voucherid"});

  return {
    categories,
    chapters,
    companies,
    documentinteractions,
    documents,
    mainsubjects,
    passwordresettokens,
    payments,
    pointtransactions,
    promotions,
    rechargepacks,
    transactions,
    uploads,
    users,
    vouchers,
    voucherusage,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
