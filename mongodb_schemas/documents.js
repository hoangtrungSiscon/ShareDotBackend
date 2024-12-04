const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  documentid: { type: String, required: true },
  mainsubjectid: { type: String, required: true },
  mainsubjectname: { type: String, required: true },
  categoryid: { type: String, required: true },
  categoryname: { type: String, required: true },
  subcategoryid: { type: String, required: true },
  subcategoryname: { type: String, required: true },
  chapterid: { type: String, required: true },
  chaptername: { type: String, required: true },
  filetype: { type: String, required: true },
  filesize: { type: Number, required: true },
  accesslevel: { type: String, required: true },
  status: { type: String, required: true },
  viewcount: { type: Number, default: 0 },
  pointcost: { type: Number, default: 0 },
  description: { type: String },
  tags: { type: [String], default: [] },
  author: { type: String },
  uploaddate: { type: Date, default: () => Date.now() },
  filepath: { type: String },
  thumbnailpath: { type: String },
  isactive: { type: Number, required: true, default: 1 },
  uploaderid: { type: String },
  uploadername: { type: String },
}, {
  timestamps: true
});

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;