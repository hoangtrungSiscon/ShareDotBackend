const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('passwordresettokens', {
    id: {
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
      unique: "passwordresettokens_userid_token_key"
    },
    token: {
      type: DataTypes.BLOB,
      allowNull: false,
      unique: "passwordresettokens_userid_token_key"
    },
    tokenexpiry: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'passwordresettokens',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "passwordresettokens_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "passwordresettokens_userid_token_key",
        unique: true,
        fields: [
          { name: "userid" },
          { name: "token" },
        ]
      },
    ]
  });
};
