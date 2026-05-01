const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  name: { type: String, required: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  duration: { type: Number, default: 0, min: 0 },
  weight: { type: Number, default: 0, min: 0 },
  caloriesBurned: { type: Number, default: 0, min: 0 },
  youtubeId: { type: String, default: '' },
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  dayKey: { type: String, index: true },
  exercises: [workoutExerciseSchema],
  totalDuration: { type: Number, default: 0, min: 0 },
  totalSets: { type: Number, default: 0, min: 0 },
  totalReps: { type: Number, default: 0, min: 0 },
  estimatedCalories: { type: Number, default: 0, min: 0 },
  location: { type: String, enum: ['gym', 'home'], required: true },
  aiSummary: { type: String, default: '' },
});

module.exports = mongoose.model('Workout', workoutSchema);
