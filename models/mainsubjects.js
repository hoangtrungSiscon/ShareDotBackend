const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mainsubjects', {
    mainsubjectid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    mainsubjectname: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "mainsubjects_mainsubjectname_key"
    }
  }, {
    sequelize,
    tableName: 'mainsubjects',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mainsubjects_mainsubjectname_key",
        unique: true,
        fields: [
          { name: "mainsubjectname" },
        ]
      },
      {
        name: "mainsubjects_pkey",
        unique: true,
        fields: [
          { name: "mainsubjectid" },
        ]
      },
    ]
  });
};
