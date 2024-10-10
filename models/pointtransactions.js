const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('pointtransactions', {
    transactionid: {
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
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transactiontype: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    transactiondate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'pointtransactions',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "pointtransactions_pkey",
        unique: true,
        fields: [
          { name: "transactionid" },
        ]
      },
    ]
  });
};
