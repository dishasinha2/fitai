const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const getActivityMultiplier = (activityLevel) => {
  if (activityLevel === 'advanced') return 1.65;
  if (activityLevel === 'intermediate') return 1.45;
  return 1.25;
};

const buildDietPlan = (user) => {
  const heightInMeters = (user.height || 170) / 100;
  const weight = user.weight || 70;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  const bmiCategory = getBmiCategory(bmi);
  const maintenanceCalories = Math.round(weight * 24 * getActivityMultiplier(user.activityLevel));

  let dailyCalories = maintenanceCalories;
  if (user.fitnessGoal === 'fat_loss') dailyCalories -= 350;
  if (user.fitnessGoal === 'muscle_gain') dailyCalories += 300;

  const protein = Math.round(weight * (user.fitnessGoal === 'muscle_gain' ? 2.1 : 1.7));
  const fat = Math.round(weight * 0.8);
  const carbs = Math.max(120, Math.round((dailyCalories - (protein * 4 + fat * 9)) / 4));

  const meals = [
    {
      name: 'Breakfast',
      calories: Math.round(dailyCalories * 0.25),
      foods: ['Oats or poha', 'Greek yogurt or eggs', 'Fruit'],
      nutrients: { protein: Math.round(protein * 0.25), carbs: Math.round(carbs * 0.25), fat: Math.round(fat * 0.2) },
    },
    {
      name: 'Lunch',
      calories: Math.round(dailyCalories * 0.3),
      foods: ['Rice or roti', 'Lean protein', 'Mixed vegetables'],
      nutrients: { protein: Math.round(protein * 0.3), carbs: Math.round(carbs * 0.3), fat: Math.round(fat * 0.3) },
    },
    {
      name: 'Snack',
      calories: Math.round(dailyCalories * 0.15),
      foods: ['Protein smoothie', 'Nuts', 'Banana'],
      nutrients: { protein: Math.round(protein * 0.15), carbs: Math.round(carbs * 0.15), fat: Math.round(fat * 0.15) },
    },
    {
      name: 'Dinner',
      calories: Math.round(dailyCalories * 0.3),
      foods: ['Paneer/chicken/tofu', 'Salad', 'Whole grains'],
      nutrients: { protein: Math.round(protein * 0.3), carbs: Math.round(carbs * 0.3), fat: Math.round(fat * 0.35) },
    },
  ];

  return {
    goal: user.fitnessGoal,
    bmi,
    bmiCategory,
    activityLevel: user.activityLevel,
    dailyCalories,
    hydrationLiters: Number((weight * 0.035).toFixed(1)),
    macros: { protein, carbs, fat },
    meals,
    notes: [
      `Aim for ${user.preferences?.workoutDaysPerWeek || 4} active days this week.`,
      user.location === 'home' ? 'Keep quick protein snacks ready for home sessions.' : 'Time carbs around heavier gym sessions for better recovery.',
      `Diet style: ${user.preferences?.dietaryPreference || 'balanced'}.`,
    ],
  };
};

module.exports = {
  buildDietPlan,
};
