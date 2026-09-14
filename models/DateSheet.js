const mongoose = require('mongoose');

const dateSheetSchema = new mongoose.Schema({
  className: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DateSheet', dateSheetSchema);
