const Exercise = require('../models/Exercise');

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

const buildRecommendation = async ({ user, previousWorkouts = [] }) => {
  const goalCategories = getGoalCategories(user.fitnessGoal);
  const difficulty = getDifficultyTargets(user.activityLevel);
  const recentExerciseNames = previousWorkouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name));

  const locationQuery =
    user.location === 'home'
      ? { $or: [{ location: 'home' }, { location: 'both' }, { equipment: 'none' }] }
      : { $or: [{ location: 'gym' }, { location: 'both' }] };

  let candidates = await Exercise.find({
    ...locationQuery,
    category: { $in: goalCategories },
    intensity: { $in: difficulty.intensity },
  }).lean();

  if (!candidates.length) {
    candidates = await Exercise.find(locationQuery).lean();
  }

  const freshCandidates = candidates.filter((exercise) => !recentExerciseNames.includes(exercise.name));
  const selectedExercises = (freshCandidates.length ? freshCandidates : candidates).slice(0, 4).map((exercise, index) => ({
    exerciseId: exercise._id,
    name: exercise.name,
    category: exercise.category,
    muscleGroup: exercise.muscleGroup,
    instructions: exercise.instructions,
    youtubeId: exercise.youtubeId,
    equipment: exercise.equipment,
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
    exercises: selectedExercises,
    nextExercise: selectedExercises[0] || null,
  };
};

module.exports = {
  buildRecommendation,
};
