const Reward = require('../models/Reward');

const getDayKey = (value = new Date()) => value.toISOString().split('T')[0];

const calculateWorkoutTotals = (exercises = []) => {
  const totalSets = exercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0);
  const totalReps = exercises.reduce((sum, exercise) => sum + Number(exercise.reps || 0), 0);
  const totalDuration = exercises.reduce((sum, exercise) => sum + Number(exercise.duration || 0), 0);
  const estimatedCalories = exercises.reduce((sum, exercise) => {
    const repCalories = Number(exercise.reps || 0) * 0.4;
    const durationCalories = Number(exercise.duration || 0) * 5;
    return sum + repCalories + durationCalories;
  }, 0);

  return {
    totalSets,
    totalReps,
    totalDuration,
    estimatedCalories: Math.round(estimatedCalories),
  };
};

const calculateStreak = (workouts = []) => {
  const daySet = new Set(workouts.map((workout) => workout.dayKey || getDayKey(new Date(workout.date))));
  const today = new Date();
  let streak = 0;

  while (true) {
    const current = new Date(today);
    current.setDate(today.getDate() - streak);
    if (daySet.has(getDayKey(current))) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
};

const rewardDefinitions = [
  {
    threshold: 7,
    key: 'streak_7',
    type: 'streak',
    title: '7-Day Streak',
    description: 'Completed workouts on seven consecutive days.',
    points: 100,
  },
  {
    threshold: 30,
    key: 'streak_30',
    type: 'badge',
    title: 'Monthly Momentum',
    description: 'Built a 30-day workout streak.',
    points: 400,
  },
];

const syncRewardsForStreak = async (userId, streak) => {
  const awarded = [];

  for (const reward of rewardDefinitions) {
    if (streak >= reward.threshold) {
      const existing = await Reward.findOne({ user: userId, key: reward.key });
      if (!existing) {
        const created = await Reward.create({
          user: userId,
          key: reward.key,
          type: reward.type,
          title: reward.title,
          description: reward.description,
          points: reward.points,
          metadata: { streakDays: streak },
        });
        awarded.push(created);
      }
    }
  }

  return awarded;
};

const buildProgressSummary = ({ user, workouts = [], progressLogs = [], rewards = [] }) => {
  const sortedLogs = [...progressLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestWeight = sortedLogs.at(-1)?.weight ?? user.weight ?? 0;
  const startingWeight = sortedLogs[0]?.weight ?? user.weight ?? latestWeight;
  const weightChange = Number((latestWeight - startingWeight).toFixed(1));
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, workout) => sum + Number(workout.totalSets || 0) * Number(workout.totalReps || 0), 0);
  const consistencyScore = Math.min(100, Math.round((calculateStreak(workouts) / 7) * 100));

  return {
    latestWeight,
    weightChange,
    totalWorkouts,
    totalVolume,
    consistencyScore,
    rewardPoints: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
  };
};

module.exports = {
  getDayKey,
  calculateWorkoutTotals,
  calculateStreak,
  syncRewardsForStreak,
  buildProgressSummary,
};
