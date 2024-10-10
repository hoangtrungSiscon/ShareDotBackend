const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('vouchers', {
    voucherid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    vouchercode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "vouchers_vouchercode_key"
    },
    promotionid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'promotions',
        key: 'promotionid'
      }
    },
    maxusagecount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    usedcount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    pointcost: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    applicableto: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    validfrom: {
      type: DataTypes.DATE,
      allowNull: false
    },
    validto: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'vouchers',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "vouchers_pkey",
        unique: true,
        fields: [
          { name: "voucherid" },
        ]
      },
      {
        name: "vouchers_vouchercode_key",
        unique: true,
        fields: [
          { name: "vouchercode" },
        ]
      },
    ]
  });
};
