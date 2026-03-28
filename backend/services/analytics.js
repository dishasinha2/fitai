const { db, mapRewardRow, toJson } = require('../db');

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
      const existing = db
        .prepare('SELECT * FROM rewards WHERE user_id = ? AND reward_key = ?')
        .get(Number(userId), reward.key);

      if (!existing) {
        const awardedAt = new Date().toISOString();
        const result = db
          .prepare(`
            INSERT INTO rewards (
              user_id,
              type,
              reward_key,
              title,
              description,
              points,
              metadata_json,
              awarded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            Number(userId),
            reward.type,
            reward.key,
            reward.title,
            reward.description,
            reward.points,
            toJson({ streakDays: streak }, {}),
            awardedAt,
          );

        awarded.push(
          mapRewardRow(db.prepare('SELECT * FROM rewards WHERE id = ?').get(result.lastInsertRowid)),
        );
      }
    }
  }

  return awarded;
};

const getExerciseCatalogMap = () => {
  const rows = db.prepare('SELECT name, muscle_group FROM exercises').all();
  return new Map(rows.map((row) => [row.name, row.muscle_group]));
};

const detectPersonalRecords = (workouts = []) => {
  const bestByExercise = new Map();

  workouts
    .slice()
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .forEach((workout) => {
      (workout.exercises || []).forEach((exercise) => {
        const score =
          Number(exercise.weight || 0) * Number(exercise.reps || 0) * Math.max(1, Number(exercise.sets || 1)) ||
          Number(exercise.reps || 0) * Math.max(1, Number(exercise.sets || 1)) ||
          Number(exercise.duration || 0);

        if (!bestByExercise.has(exercise.name) || score > bestByExercise.get(exercise.name).score) {
          bestByExercise.set(exercise.name, {
            name: exercise.name,
            score,
            weight: Number(exercise.weight || 0),
            reps: Number(exercise.reps || 0),
            sets: Number(exercise.sets || 0),
            duration: Number(exercise.duration || 0),
            date: workout.date,
          });
        }
      });
    });

  return Array.from(bestByExercise.values())
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
};

const buildMuscleGroupFocus = (workouts = []) => {
  const catalogMap = getExerciseCatalogMap();
  const trend = {};

  workouts.slice(-10).forEach((workout) => {
    (workout.exercises || []).forEach((exercise) => {
      const muscleGroup = exercise.muscleGroup || catalogMap.get(exercise.name) || 'full_body';
      trend[muscleGroup] = (trend[muscleGroup] || 0) + 1;
    });
  });

  return Object.entries(trend)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([muscleGroup, count]) => ({ muscleGroup, count }));
};

const buildProgressReport = ({ user, summary, workouts = [], progressLogs = [], rewards = [] }) => {
  const latestWorkout = workouts.at(-1);
  const personalRecords = detectPersonalRecords(workouts);
  const muscleGroupFocus = buildMuscleGroupFocus(workouts);

  return {
    generatedAt: new Date().toISOString(),
    user: {
      name: user.name,
      goal: user.fitnessGoal,
      activityLevel: user.activityLevel,
      location: user.location,
    },
    summary,
    totals: {
      workouts: workouts.length,
      progressLogs: progressLogs.length,
      rewardPoints: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
      latestWorkoutDate: latestWorkout?.date || null,
    },
    personalRecords,
    muscleGroupFocus,
    shareText: `${user.name} has completed ${summary.totalWorkouts || 0} workouts with a ${summary.consistencyScore || 0}% consistency score and ${summary.rewardPoints || 0} reward points on FitAI.`,
  };
};

const buildProgressSummary = ({ user, workouts = [], progressLogs = [], rewards = [] }) => {
  const sortedLogs = [...progressLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestWeight = sortedLogs.at(-1)?.weight ?? user.weight ?? 0;
  const startingWeight = sortedLogs[0]?.weight ?? user.weight ?? latestWeight;
  const weightChange = Number((latestWeight - startingWeight).toFixed(1));
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, workout) => sum + Number(workout.totalSets || 0) * Number(workout.totalReps || 0), 0);
  const consistencyScore = Math.min(100, Math.round((calculateStreak(workouts) / 7) * 100));
  const totalCalories = workouts.reduce((sum, workout) => sum + Number(workout.estimatedCalories || 0), 0);
  const averageWorkoutDuration = totalWorkouts
    ? Math.round(workouts.reduce((sum, workout) => sum + Number(workout.totalDuration || 0), 0) / totalWorkouts)
    : 0;
  const bestWorkoutDuration = workouts.reduce(
    (best, workout) => Math.max(best, Number(workout.totalDuration || 0)),
    0,
  );
  const activeDays = new Set(workouts.map((workout) => workout.dayKey || getDayKey(new Date(workout.date)))).size;

  return {
    latestWeight,
    weightChange,
    totalWorkouts,
    totalVolume,
    consistencyScore,
    totalCalories,
    averageWorkoutDuration,
    bestWorkoutDuration,
    activeDays,
    personalRecords: detectPersonalRecords(workouts),
    muscleGroupFocus: buildMuscleGroupFocus(workouts),
    rewardPoints: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
  };
};

module.exports = {
  getDayKey,
  calculateWorkoutTotals,
  calculateStreak,
  syncRewardsForStreak,
  detectPersonalRecords,
  buildMuscleGroupFocus,
  buildProgressSummary,
  buildProgressReport,
};
