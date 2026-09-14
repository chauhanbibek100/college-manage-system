const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  filePath: { type: String, required: true },
  originalName: { type: String },
  uploadDate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Calendar', calendarSchema);
