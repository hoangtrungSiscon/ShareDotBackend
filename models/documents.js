const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('documents', {
    documentid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "documents_title_key"
    },
    filetype: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    filepath: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    filesize: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    accesslevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Public"
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Unapproved"
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    viewcount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    likecount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    pointcost: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    chapterid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'chapterid'
      }
    }
  }, {
    sequelize,
    tableName: 'documents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "documents_pkey",
        unique: true,
        fields: [
          { name: "documentid" },
        ]
      },
      {
        name: "documents_title_key",
        unique: true,
        fields: [
          { name: "title" },
        ]
      },
    ]
  });
};
