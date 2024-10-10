const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('documentinteractions', {
    interactionid: {
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
      unique: "documentinteractions_userid_documentid_key"
    },
    documentid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'documentid'
      },
      unique: "documentinteractions_userid_documentid_key"
    },
    isliked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    isbookmarked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    viewdate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    likedate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    bookmarkdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isfinishedreading: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'documentinteractions',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "documentinteractions_pkey",
        unique: true,
        fields: [
          { name: "interactionid" },
        ]
      },
      {
        name: "documentinteractions_userid_documentid_key",
        unique: true,
        fields: [
          { name: "userid" },
          { name: "documentid" },
        ]
      },
    ]
  });
};
