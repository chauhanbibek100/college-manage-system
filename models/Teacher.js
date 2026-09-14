const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  dob: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  registrationDate: { type: String },
  subject: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
