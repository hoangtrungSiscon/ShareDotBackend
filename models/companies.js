const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('companies', {
    companyid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    companyname: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "companies_companyname_key"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactinfo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    imagepath: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'companies',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "companies_companyname_key",
        unique: true,
        fields: [
          { name: "companyname" },
        ]
      },
      {
        name: "companies_pkey",
        unique: true,
        fields: [
          { name: "companyid" },
        ]
      },
    ]
  });
};
