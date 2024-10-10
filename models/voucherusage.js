const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('voucherusage', {
    voucherusageid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userid'
      },
      unique: "voucherusage_userid_voucherid_key"
    },
    voucherid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vouchers',
        key: 'voucherid'
      },
      unique: "voucherusage_userid_voucherid_key"
    },
    discountamount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    useddate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'voucherusage',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "voucherusage_pkey",
        unique: true,
        fields: [
          { name: "voucherusageid" },
        ]
      },
      {
        name: "voucherusage_userid_voucherid_key",
        unique: true,
        fields: [
          { name: "userid" },
          { name: "voucherid" },
        ]
      },
    ]
  });
};
