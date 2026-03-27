const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  weight: { type: Number, min: 20 },
  bodyFat: { type: Number, min: 0, max: 100 },
  workoutCount: { type: Number, default: 0, min: 0 },
  totalVolume: { type: Number, default: 0, min: 0 },
  consistencyScore: { type: Number, default: 0, min: 0 },
  measurements: {
    chest: { type: Number, default: 0 },
    waist: { type: Number, default: 0 },
    arms: { type: Number, default: 0 },
  },
  notes: { type: String, default: '' },
});

module.exports = mongoose.model('Progress', progressSchema);
