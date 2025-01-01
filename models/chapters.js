const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('chapters', {
    chapterid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    chaptername: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    chapterorder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "chapters_chapterorder_categoryid_key"
    },
    categoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'categoryid'
      },
      unique: "chapters_chapterorder_categoryid_key"
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "chapters_slug_unique"
    }
  }, {
    sequelize,
    tableName: 'chapters',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "chapters_chapterorder_categoryid_key",
        unique: true,
        fields: [
          { name: "chapterorder" },
          { name: "categoryid" },
        ]
      },
      {
        name: "chapters_pkey",
        unique: true,
        fields: [
          { name: "chapterid" },
        ]
      },
      {
        name: "chapters_slug_unique",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
};
