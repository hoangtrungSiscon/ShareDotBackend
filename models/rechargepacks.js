const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('rechargepacks', {
    packid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    packname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "rechargepacks_packname_key"
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    isactive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'rechargepacks',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "rechargepacks_packname_key",
        unique: true,
        fields: [
          { name: "packname" },
        ]
      },
      {
        name: "rechargepacks_pkey",
        unique: true,
        fields: [
          { name: "packid" },
        ]
      },
    ]
  });
};
