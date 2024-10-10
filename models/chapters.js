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
      allowNull: false
    },
    categoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'categoryid'
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'chapters',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "chapters_pkey",
        unique: true,
        fields: [
          { name: "chapterid" },
        ]
      },
    ]
  });
};
