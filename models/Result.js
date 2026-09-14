const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  filePath: { type: String, required: true },
  originalName: { type: String },
  uploadDate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
