const { db, mapExerciseRow } = require('../db');

const getDifficultyTargets = (activityLevel) => {
  if (activityLevel === 'advanced') {
    return { sets: 4, reps: 8, duration: 18, intensity: ['moderate', 'high'] };
  }

  if (activityLevel === 'intermediate') {
    return { sets: 3, reps: 10, duration: 15, intensity: ['moderate'] };
  }

  return { sets: 2, reps: 12, duration: 12, intensity: ['low', 'moderate'] };
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

const buildAiSummary = ({ user, selectedExercises }) => {
  const focus = user.location === 'home' ? 'a no-equipment home session' : 'a gym-based strength block';
  return `FitAI planned ${focus} for ${user.fitnessGoal.replace('_', ' ')} using ${selectedExercises.length} exercises tailored to ${user.activityLevel} level.`;
};

const scoreExercise = ({ exercise, user, goalCategories, recentExerciseNames, recentMuscleGroups }) => {
  let score = 40;

  if (goalCategories.includes(exercise.category)) {
    score += 24;
  }

  if (exercise.location === user.location || exercise.location === 'both') {
    score += 18;
  }

  if (user.location === 'home' && exercise.equipment === 'none') {
    score += 12;
  }

  if (!recentExerciseNames.includes(exercise.name)) {
    score += 14;
  } else {
    score -= 10;
  }

  if (!recentMuscleGroups.includes(exercise.muscleGroup)) {
    score += 10;
  } else {
    score -= 4;
  }

  if (user.fitnessGoal === 'muscle_gain' && exercise.category === 'strength') {
    score += 8;
  }

  if (user.fitnessGoal === 'fat_loss' && ['conditioning', 'cardio'].includes(exercise.category)) {
    score += 8;
  }

  return score;
};

const buildRecommendation = async ({ user, previousWorkouts = [] }) => {
  const goalCategories = getGoalCategories(user.fitnessGoal);
  const difficulty = getDifficultyTargets(user.activityLevel);
  const recentExerciseNames = previousWorkouts.flatMap((workout) =>
    (workout.exercises || []).map((exercise) => exercise.name),
  );
  const recentMuscleGroups = previousWorkouts.flatMap((workout) =>
    (workout.exercises || []).map((exercise) => exercise.muscleGroup).filter(Boolean),
  );

  const baseRows =
    user.location === 'home'
      ? db
          .prepare(
            `
              SELECT * FROM exercises
              WHERE (location IN ('home', 'both') OR equipment = 'none')
                AND category IN (${goalCategories.map(() => '?').join(', ')})
                AND intensity IN (${difficulty.intensity.map(() => '?').join(', ')})
              ORDER BY category, name
            `,
          )
          .all(...goalCategories, ...difficulty.intensity)
      : db
          .prepare(
            `
              SELECT * FROM exercises
              WHERE location IN ('gym', 'both')
                AND category IN (${goalCategories.map(() => '?').join(', ')})
                AND intensity IN (${difficulty.intensity.map(() => '?').join(', ')})
              ORDER BY category, name
            `,
          )
          .all(...goalCategories, ...difficulty.intensity);

  let candidates = baseRows.map(mapExerciseRow);

  if (!candidates.length) {
    const fallbackRows =
      user.location === 'home'
        ? db
            .prepare(
              "SELECT * FROM exercises WHERE location IN ('home', 'both') OR equipment = 'none' ORDER BY category, name",
            )
            .all()
        : db.prepare("SELECT * FROM exercises WHERE location IN ('gym', 'both') ORDER BY category, name").all();

    candidates = fallbackRows.map(mapExerciseRow);
  }

  const scoredCandidates = candidates
    .map((exercise) => ({
      ...exercise,
      recommendationScore: scoreExercise({
        exercise,
        user,
        goalCategories,
        recentExerciseNames,
        recentMuscleGroups,
      }),
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  const freshCandidates = scoredCandidates.filter((exercise) => !recentExerciseNames.includes(exercise.name));
  const selectedExercises = (freshCandidates.length ? freshCandidates : scoredCandidates).slice(0, 4).map((exercise, index) => ({
    exerciseId: exercise._id,
    name: exercise.name,
    category: exercise.category,
    muscleGroup: exercise.muscleGroup,
    instructions: exercise.instructions,
    youtubeId: exercise.youtubeId,
    equipment: exercise.equipment,
    recommendationScore: exercise.recommendationScore,
    sets: difficulty.sets,
    reps: exercise.category === 'cardio' ? difficulty.reps + 2 : difficulty.reps,
    duration: index === 0 && exercise.category === 'mobility' ? 8 : difficulty.duration,
    reason:
      user.location === 'home' && exercise.equipment === 'none'
        ? 'Fits your home workout mode with no equipment.'
        : `Supports your ${user.fitnessGoal.replace('_', ' ')} goal.`,
  }));

  return {
    focus: goalCategories[0],
    aiSummary: buildAiSummary({ user, selectedExercises }),
    recommendationInsights: {
      basedOnGoal: user.fitnessGoal,
      basedOnLocation: user.location,
      recentExerciseCount: recentExerciseNames.length,
      recentMuscleGroups: [...new Set(recentMuscleGroups)].slice(0, 4),
    },
    exercises: selectedExercises,
    nextExercise: selectedExercises[0] || null,
  };
};

module.exports = {
  buildRecommendation,
};
