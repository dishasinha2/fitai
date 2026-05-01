const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['cardio', 'strength', 'mobility', 'core', 'conditioning'],
    required: true,
  },
  equipment: { type: String, default: 'none' },
  location: { type: String, enum: ['gym', 'home', 'both'], default: 'both' },
  intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
  muscleGroup: { type: String, default: 'full_body' },
  youtubeId: { type: String, default: '' },
  instructions: { type: String, default: '' },
  tags: [{ type: String }],
});

module.exports = mongoose.model('Exercise', exerciseSchema);
