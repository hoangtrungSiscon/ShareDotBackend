const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('promotions', {
    promotionid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    companyid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'companyid'
      }
    },
    budget: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    promotionname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discounttype: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    discountvalue: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    minimumpurchaseamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    maxdiscountamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Active"
    }
  }, {
    sequelize,
    tableName: 'promotions',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "promotions_pkey",
        unique: true,
        fields: [
          { name: "promotionid" },
        ]
      },
    ]
  });
};
