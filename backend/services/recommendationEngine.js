const { db, mapExerciseRow } = require('../db');
const { getPredictionDetails, getModelStatus } = require('./mlRecommendationEngine');

const getDifficultyTargets = (activityLevel) => {
  if (activityLevel === 'advanced') {
    return { sets: 4, reps: 8, duration: 18, intensity: ['moderate', 'high'] };
  }

  if (activityLevel === 'intermediate') {
    return { sets: 3, reps: 10, duration: 15, intensity: ['moderate'] };
  }

  return { sets: 2, reps: 12, duration: 12, intensity: ['low', 'moderate'] };
};

const buildAiSummary = ({ user, selectedExercises }) => {
  const focus = user.location === 'home' ? 'a no-equipment home session' : 'a gym-based strength block';
  return `FitAI planned ${focus} for ${user.fitnessGoal.replace('_', ' ')} using ${selectedExercises.length} exercises tailored to ${user.activityLevel} level.`;
};

const getGoalCategories = (fitnessGoal) => {
  if (fitnessGoal === 'fat_loss') {
    return ['conditioning', 'cardio', 'strength', 'core'];
  }

  if (fitnessGoal === 'muscle_gain') {
    return ['strength', 'core', 'mobility'];
  }

  return ['strength', 'mobility', 'core', 'cardio'];
};

const getWorkoutTimeOfDay = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 11) {
    return 'morning';
  }
  if (hour < 17) {
    return 'afternoon';
  }
  return 'evening';
};

const estimatePreviousDayPerformance = (previousWorkouts = []) => {
  const previousWorkout = previousWorkouts[0];
  if (!previousWorkout) {
    return 35;
  }

  const durationScore = Number(previousWorkout.totalDuration || 0) * 0.6;
  const volumeScore = Number(previousWorkout.totalSets || 0) * Number(previousWorkout.totalReps || 0) * 0.08;
  const calorieScore = Number(previousWorkout.estimatedCalories || 0) * 0.05;
  return Math.round((durationScore + volumeScore + calorieScore) * 10) / 10;
};

const calculateRecentSuccessScore = ({ exercise, previousWorkouts = [] }) => {
  if (!previousWorkouts.length) {
    return 0;
  }

  const matchingEntries = previousWorkouts.flatMap((workout) =>
    (workout.exercises || [])
      .filter((item) => normalizeExerciseName(item.name) === normalizeExerciseName(exercise.name))
      .map((item) => ({
        ...item,
        workoutTotalDuration: workout.totalDuration || 0,
        estimatedCalories: workout.estimatedCalories || 0,
      })),
  );

  if (!matchingEntries.length) {
    return 0;
  }

  const averageEntryScore =
    matchingEntries.reduce((sum, item) => {
      const volume = Number(item.sets || 0) * Number(item.reps || 0);
      const duration = Number(item.duration || 0);
      const weight = Number(item.weight || 0);
      return sum + volume * 0.12 + duration * 0.5 + weight * 0.08;
    }, 0) / matchingEntries.length;

  return Math.min(20, Math.round(averageEntryScore) / 2);
};

const scoreRuleBasedRecommendation = ({ exercise, user, goalCategories, recentExerciseNames, recentMuscleGroups }) => {
  let score = 35;

  if (goalCategories.includes(exercise.category)) {
    score += 22;
  }
  if (exercise.location === user.location || exercise.location === 'both') {
    score += 16;
  }
  if (user.location === 'home' && exercise.equipment === 'none') {
    score += 12;
  }
  if (!recentExerciseNames.includes(exercise.name)) {
    score += 10;
  }
  if (!recentMuscleGroups.includes(exercise.muscleGroup)) {
    score += 8;
  }
  if (user.fitnessGoal === 'fat_loss' && ['conditioning', 'cardio'].includes(exercise.category)) {
    score += 8;
  }
  if (user.fitnessGoal === 'muscle_gain' && exercise.category === 'strength') {
    score += 8;
  }

  return score;
};

const normalizeExerciseName = (name = '') => String(name).trim().toLowerCase();

const dedupeRecommendationsByName = (exercises = []) => {
  const bestByName = new Map();

  exercises.forEach((exercise, index) => {
    const normalizedName = normalizeExerciseName(exercise.name);

    if (!normalizedName) {
      return;
    }

    const existing = bestByName.get(normalizedName);
    if (!existing || Number(exercise.recommendationScore || 0) > Number(existing.exercise.recommendationScore || 0)) {
      bestByName.set(normalizedName, {
        exercise,
        firstIndex: existing ? existing.firstIndex : index,
      });
    }
  });

  return [...bestByName.values()]
    .sort((left, right) => {
      const scoreDelta =
        Number(right.exercise.recommendationScore || 0) - Number(left.exercise.recommendationScore || 0);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.firstIndex - right.firstIndex;
    })
    .map((item) => item.exercise);
};

const buildRecommendation = async ({ user, previousWorkouts = [] }) => {
  const difficulty = getDifficultyTargets(user.activityLevel);
  const goalCategories = getGoalCategories(user.fitnessGoal);
  const now = new Date();
  const recentExerciseNames = previousWorkouts.flatMap((workout) =>
    (workout.exercises || []).map((exercise) => exercise.name),
  );
  const recentMuscleGroups = previousWorkouts.flatMap((workout) =>
    (workout.exercises || []).map((exercise) => exercise.muscleGroup).filter(Boolean),
  );
  const workoutTimeOfDay = getWorkoutTimeOfDay(now);
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const previousDayPerformance = estimatePreviousDayPerformance(previousWorkouts);

  const baseRows =
    user.location === 'home'
      ? db
          .prepare(
            `
              SELECT * FROM exercises
              WHERE location IN ('home', 'both') OR equipment = 'none'
              ORDER BY category, name
            `,
          )
          .all()
      : db
          .prepare(
            `
              SELECT * FROM exercises
              WHERE location IN ('gym', 'both')
              ORDER BY category, name
            `,
          )
          .all();

  let candidates = baseRows.map(mapExerciseRow);

  const scoredCandidates = candidates
    .map((exercise) => ({
      predictionDetails: getPredictionDetails({
        goal: user.fitnessGoal,
        fitnessLevel: user.activityLevel,
        equipment: exercise.equipment || 'none',
        exerciseName: exercise.name,
        exerciseCategory: exercise.category || '',
        location: user.location,
        workoutTimeOfDay,
        dayOfWeek,
        previousDayPerformance,
        goalExperienceInteraction: `${user.fitnessGoal}__${user.activityLevel}`,
        locationEquipmentInteraction: `${user.location}__${user.location === 'gym' ? 'full_gym' : 'minimal'}`,
      }),
      ...exercise,
      ruleScore: scoreRuleBasedRecommendation({
        exercise,
        user,
        goalCategories,
        recentExerciseNames,
        recentMuscleGroups,
      }),
      recentSuccessScore: calculateRecentSuccessScore({ exercise, previousWorkouts }),
    }))
    .map((exercise) => ({
      ...exercise,
      mlProbability: exercise.predictionDetails.probability,
      categoryProbability: exercise.predictionDetails.categoryProbability,
      withinCategoryProbability: exercise.predictionDetails.withinCategoryProbability,
      fitScoreBreakdown: {
        ruleScore: Math.round(exercise.ruleScore * 10) / 10,
        mlScore: Math.round(exercise.predictionDetails.probability * 1000) / 10,
        categoryScore: Math.round(exercise.predictionDetails.categoryProbability * 1000) / 10,
        withinCategoryScore: Math.round(exercise.predictionDetails.withinCategoryProbability * 1000) / 10,
        recentSuccessScore: Math.round(exercise.recentSuccessScore * 10) / 10,
        source: exercise.predictionDetails.source,
      },
      recommendationScore:
        Math.round(
          (exercise.ruleScore + exercise.predictionDetails.probability * 100 + exercise.recentSuccessScore) * 10,
        ) / 10,
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  const uniqueScoredCandidates = dedupeRecommendationsByName(scoredCandidates);

  const selectedExercises = uniqueScoredCandidates.slice(0, 4).map((exercise, index) => ({
    exerciseId: exercise._id,
    name: exercise.name,
    category: exercise.category,
    muscleGroup: exercise.muscleGroup,
    instructions: exercise.instructions,
    youtubeId: exercise.youtubeId,
    equipment: exercise.equipment,
    recommendationScore: exercise.recommendationScore,
    mlProbability: exercise.mlProbability,
    categoryProbability: exercise.categoryProbability,
    withinCategoryProbability: exercise.withinCategoryProbability,
    fitScoreBreakdown: exercise.fitScoreBreakdown,
    sets: difficulty.sets,
    reps: exercise.category === 'cardio' ? difficulty.reps + 2 : difficulty.reps,
    duration: index === 0 && exercise.category === 'mobility' ? 8 : difficulty.duration,
    reason: `Selected using FitAI fit score blending rule match, learned probability, and your recent workout success for ${user.fitnessGoal.replace('_', ' ')}.`,
  }));

  return {
    focus: selectedExercises[0]?.category || 'strength',
    aiSummary: buildAiSummary({ user, selectedExercises }),
    recommendationSource: {
      type: getModelStatus().model_trained ? 'rule-plus-ml' : 'rule-based',
      mlModel: getModelStatus(),
    },
    recommendationInsights: {
      basedOnGoal: user.fitnessGoal,
      basedOnLocation: user.location,
      workoutTimeOfDay,
      dayOfWeek,
      previousDayPerformance,
      recentExerciseCount: recentExerciseNames.length,
      recentMuscleGroups: [...new Set(recentMuscleGroups)].slice(0, 4),
    },
    exercises: selectedExercises,
    nextExercise: selectedExercises[0] || null,
  };
};

module.exports = {
  buildRecommendation,
  dedupeRecommendationsByName,
};
