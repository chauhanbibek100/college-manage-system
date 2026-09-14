const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  className: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: String, required: true },
  receiptNo: { type: String, required: true, unique: true },
  monthsCovered: { type: Number, default: 1, min: 1 },
  cycleRange: {
    from: { type: Number },
    to: { type: Number }
  },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
