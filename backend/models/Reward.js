const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['streak', 'badge', 'points'], required: true },
  key: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  points: { type: Number, default: 0 },
  metadata: {
    streakDays: { type: Number, default: 0 },
  },
  awardedAt: { type: Date, default: Date.now },
});

rewardSchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Reward', rewardSchema);
