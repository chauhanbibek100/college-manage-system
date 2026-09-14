const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true },
  dob: { type: String },
  address: { type: String },
  registrationDate: { type: String },
  parentContact: { type: String },
  className: { type: String, required: true },
  isHostler: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
