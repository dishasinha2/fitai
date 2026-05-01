const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  foods: [{ type: String }],
  nutrients: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
}, { _id: false });

const dietPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true },
  bmi: { type: Number, required: true },
  bmiCategory: { type: String, required: true },
  activityLevel: { type: String, required: true },
  dailyCalories: { type: Number, required: true },
  hydrationLiters: { type: Number, required: true },
  macros: {
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
  },
  meals: [mealSchema],
  notes: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
