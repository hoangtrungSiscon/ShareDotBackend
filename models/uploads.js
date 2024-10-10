const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('uploads', {
    uploadid: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    uploaderid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userid'
      },
      unique: "uploads_uploaderid_documentid_key"
    },
    documentid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'documentid'
      },
      unique: "uploads_uploaderid_documentid_key"
    },
    uploaddate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'uploads',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "uploads_pkey",
        unique: true,
        fields: [
          { name: "uploadid" },
        ]
      },
      {
        name: "uploads_uploaderid_documentid_key",
        unique: true,
        fields: [
          { name: "uploaderid" },
          { name: "documentid" },
        ]
      },
    ]
  });
};
