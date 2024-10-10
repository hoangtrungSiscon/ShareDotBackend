const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('categories', {
    categoryid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    categoryname: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "categories_categoryname_key"
    },
    mainsubjectid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mainsubjects',
        key: 'mainsubjectid'
      }
    },
    parentcategoryid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'categoryid'
      }
    }
  }, {
    sequelize,
    tableName: 'categories',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "categories_categoryname_key",
        unique: true,
        fields: [
          { name: "categoryname" },
        ]
      },
      {
        name: "categories_pkey",
        unique: true,
        fields: [
          { name: "categoryid" },
        ]
      },
    ]
  });
};
