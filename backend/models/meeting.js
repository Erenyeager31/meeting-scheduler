const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // Reference User model
    required: true
  },
  employeeName: { type: String, required: true },
  // date: { type: Date, required: true },        // normalized meeting date (midnight)
  startTime: { type: Date, required: true },   // exact start datetime
  endTime: { type: Date, required: true },     // exact end datetime
  status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled' },
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for fast conflict detection
meetingSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
