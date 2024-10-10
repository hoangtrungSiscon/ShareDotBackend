const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('payments', {
    paymentid: {
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
      }
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    transactionid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: "payments_transactionid_key"
    },
    bank: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    paymentdate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paymentmethod: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'payments',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "payments_pkey",
        unique: true,
        fields: [
          { name: "paymentid" },
        ]
      },
      {
        name: "payments_transactionid_key",
        unique: true,
        fields: [
          { name: "transactionid" },
        ]
      },
    ]
  });
};
