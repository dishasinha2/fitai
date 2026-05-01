const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  age: { type: Number, min: 12, max: 100 },
  weight: { type: Number, min: 20 },
  height: { type: Number, min: 100 },
  fitnessGoal: {
    type: String,
    enum: ['fat_loss', 'muscle_gain', 'maintenance'],
    default: 'maintenance',
  },
  activityLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  location: {
    type: String,
    enum: ['gym', 'home'],
    default: 'gym',
  },
  preferences: {
    workoutDaysPerWeek: { type: Number, default: 4 },
    sessionDuration: { type: Number, default: 45 },
    dietaryPreference: { type: String, default: 'balanced' },
    focusAreas: [{ type: String }],
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.password;
      return ret;
    },
  },
});

module.exports = mongoose.model('User', userSchema);
