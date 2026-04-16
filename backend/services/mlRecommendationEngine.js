const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL_PATH = path.join(__dirname, '..', 'ml', 'artifacts', 'recommender_model.json');

let cachedModel = null;
let cachedMtimeMs = 0;

const normalizeExerciseName = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const canonicalExerciseName = (value = '') =>
  normalizeExerciseName(value)
    .replace(/\bpush ups\b/g, 'push up')
    .replace(/\bpush-ups\b/g, 'push up')
    .replace(/\bbodyweight squats\b/g, 'bodyweight squat')
    .replace(/\bsquats\b/g, 'squat')
    .replace(/\bpulldowns\b/g, 'pulldown')
    .replace(/\bflies\b/g, 'fly')
    .replace(/\bextensions\b/g, 'extension')
    .replace(/\bcurls\b/g, 'curl')
    .replace(/\bpresses\b/g, 'press')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeExerciseName = (value = '') =>
  canonicalExerciseName(value)
    .split(/[\s-]+/)
    .filter(Boolean);

const EXERCISE_ALIASES = {
  'lat pulldown': [
    'pronated grip lat pulldown',
    'supinated grip lat pulldown',
    'straight arm lat pulldown',
    'one-handed lat pulldown',
  ],
  'bench press': [
    'bench press - barbell',
    'bench press - dumbbell',
    'bench press - machine',
    'bench press - smith machine',
  ],
  'push up': [
    'push-up',
    'push-ups',
    'incline push-up',
    'kneeling push-up',
  ],
  plank: [
    'plank',
    'side plank',
    'forearm plank knee to elbow',
  ],
  squat: [
    'bodyweight squat',
    'bodyweight squats',
    'bulgarian split squat',
  ],
};

const EXERCISE_MAPPING_TABLE = {
  'lat pulldown': {
    strength: {
      machine: [
        'pronated grip lat pulldown',
        'supinated grip lat pulldown',
        'one-handed lat pulldown',
        'straight arm lat pulldown',
      ],
    },
  },
  'bench press': {
    strength: {
      barbell: [
        'bench press - barbell',
        'incline bench press - barbell',
        'decline bench press - barbell',
      ],
      dumbbell: [
        'bench press - dumbbell',
        'incline bench press - dumbbell',
      ],
      machine: [
        'bench press - machine',
        'incline bench press - machine',
      ],
    },
  },
  'push up': {
    strength: {
      none: [
        'push-up',
        'push-ups',
        'incline push-up',
        'kneeling push-up',
        'close-grip push-up',
      ],
      bodyweight: [
        'push-up',
        'push-ups',
        'incline push-up',
        'kneeling push-up',
      ],
    },
  },
  plank: {
    core: {
      none: [
        'plank',
        'side plank',
        'forearm plank knee to elbow',
        'copenhagen plank with leg lift',
      ],
    },
  },
};

const resolveDisplayProbability = (item) =>
  Number(item?.relative_probability ?? item?.probability ?? 0);

const isCategoryMatch = (itemCategory, exerciseCategory) =>
  !exerciseCategory || !itemCategory || itemCategory === exerciseCategory;

const getMappedAliases = (exerciseName, exerciseCategory = '', equipment = '') => {
  const canonicalName = canonicalExerciseName(exerciseName);
  const categoryKey = normalizeExerciseName(exerciseCategory);
  const equipmentKey = normalizeExerciseName(equipment, 'none');
  const mapped = EXERCISE_MAPPING_TABLE[canonicalName];

  if (!mapped) {
    return EXERCISE_ALIASES[canonicalName] || [];
  }

  const byCategory = mapped[categoryKey] || {};
  const exactEquipmentAliases = byCategory[equipmentKey] || [];
  const fallbackAliases = Object.values(byCategory).flat();

  return [...new Set([...exactEquipmentAliases, ...fallbackAliases, ...(EXERCISE_ALIASES[canonicalName] || [])])];
};

const findBestExerciseMatch = (rankedItems = [], exerciseName, exerciseCategory = '', equipment = '') => {
  const normalizedExerciseName = normalizeExerciseName(exerciseName);
  const canonicalName = canonicalExerciseName(exerciseName);
  const targetTokens = tokenizeExerciseName(exerciseName);
  const aliasNames = getMappedAliases(exerciseName, exerciseCategory, equipment);

  const exactMatch = rankedItems.find(
    (item) =>
      normalizeExerciseName(item.exercise) === normalizedExerciseName &&
      isCategoryMatch(item.category, exerciseCategory),
  );
  if (exactMatch) {
    return exactMatch;
  }

  const canonicalMatch = rankedItems.find(
    (item) =>
      canonicalExerciseName(item.exercise) === canonicalName &&
      isCategoryMatch(item.category, exerciseCategory),
  );
  if (canonicalMatch) {
    return canonicalMatch;
  }

  const aliasMatch = rankedItems
    .filter((item) => isCategoryMatch(item.category, exerciseCategory))
    .map((item) => ({
      item,
      aliasScore: aliasNames.findIndex(
        (alias) => canonicalExerciseName(item.exercise) === canonicalExerciseName(alias),
      ),
      probability: resolveDisplayProbability(item),
    }))
    .filter((entry) => entry.aliasScore >= 0)
    .sort((left, right) => {
      if (left.aliasScore !== right.aliasScore) {
        return left.aliasScore - right.aliasScore;
      }
      return right.probability - left.probability;
    })[0]?.item;
  if (aliasMatch) {
    return aliasMatch;
  }

  const fuzzyScoredMatches = rankedItems
    .filter((item) => isCategoryMatch(item.category, exerciseCategory))
    .map((item) => {
      const itemTokens = tokenizeExerciseName(item.exercise);
      const overlap = targetTokens.filter((token) => itemTokens.includes(token)).length;
      const aliasOverlap = aliasNames.some((alias) => canonicalExerciseName(item.exercise) === canonicalExerciseName(alias));
      const containsBase =
        canonicalExerciseName(item.exercise).includes(canonicalName) ||
        canonicalName.includes(canonicalExerciseName(item.exercise));

      return {
        item,
        overlap,
        aliasOverlap,
        containsBase,
        probability: resolveDisplayProbability(item),
      };
    })
    .filter((entry) => entry.overlap > 0 || entry.containsBase || entry.aliasOverlap)
    .sort((left, right) => {
      if (Number(right.aliasOverlap) !== Number(left.aliasOverlap)) {
        return Number(right.aliasOverlap) - Number(left.aliasOverlap);
      }
      if (right.overlap !== left.overlap) {
        return right.overlap - left.overlap;
      }
      if (Number(right.containsBase) !== Number(left.containsBase)) {
        return Number(right.containsBase) - Number(left.containsBase);
      }
      return right.probability - left.probability;
    });

  return fuzzyScoredMatches[0]?.item || null;
};

const loadModel = () => {
  const modelPath = process.env.ML_RECOMMENDER_MODEL_PATH || DEFAULT_MODEL_PATH;

  try {
    const stats = fs.statSync(modelPath);
    if (!cachedModel || stats.mtimeMs !== cachedMtimeMs) {
      cachedModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      cachedMtimeMs = stats.mtimeMs;
    }
  } catch (_error) {
    cachedModel = null;
    cachedMtimeMs = 0;
  }

  return cachedModel;
};

const getModelStatus = () => {
  const modelPath = process.env.ML_RECOMMENDER_MODEL_PATH || DEFAULT_MODEL_PATH;
  const model = loadModel();
  const artifactExists = fs.existsSync(modelPath);
  const featureImportanceEntries = Object.entries(model?.feature_importance || {});
  const topFeatures = featureImportanceEntries
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 8)
    .map(([feature, value]) => ({
      feature,
      importance: Number(value || 0),
    }));

  const confidenceSummary = {
    average_train_confidence: Number(model?.confidence_summary?.average_train_confidence || 0),
    average_validation_confidence: Number(model?.confidence_summary?.average_validation_confidence || 0),
    min_confidence: Number(model?.confidence_summary?.min_confidence || 0),
    max_confidence: Number(model?.confidence_summary?.max_confidence || 0),
  };

  const metrics = {
    train_accuracy: Number(model?.metrics?.train_accuracy || 0),
    precision: Number(model?.metrics?.precision || 0),
    recall: Number(model?.metrics?.recall || 0),
    f1_score: Number(model?.metrics?.f1_score || 0),
    cross_validation: model?.metrics?.cross_validation || null,
  };

  return {
    artifact_exists: artifactExists,
    artifact_path: modelPath,
    dataset_size: model?.dataset_size || 0,
    augmented_dataset_size: model?.augmented_dataset_size || model?.dataset_size || 0,
    model_trained: Boolean(model?.model_trained),
    last_training_time: model?.trained_at || null,
    model_type: model?.model_type || 'unknown',
    average_confidence: confidenceSummary.average_train_confidence,
    confidence_summary: confidenceSummary,
    metrics,
    cross_validation: metrics.cross_validation,
    train_accuracy: metrics.train_accuracy,
    hierarchical_enabled: Boolean(model?.hierarchical_lookup || model?.hierarchical_lookup_enhanced),
    category_classes: model?.category_classes || [],
    category_count: Array.isArray(model?.category_classes) ? model.category_classes.length : 0,
    top_features: topFeatures,
    training_ready: Boolean(model?.model_trained && (model?.dataset_size || 0) > 0),
  };
};

const getPredictionDetails = ({
  goal,
  fitnessLevel,
  equipment,
  exerciseName,
  exerciseCategory = '',
  location = '',
  workoutTimeOfDay = '',
  dayOfWeek = '',
  previousDayPerformance = 0,
  goalExperienceInteraction = '',
  locationEquipmentInteraction = '',
}) => {
  const model = loadModel();
  if (!model?.model_trained) {
    return {
      probability: 0,
      rawProbability: 0,
      categoryProbability: 0,
      withinCategoryProbability: 0,
      source: 'untrained',
    };
  }

  const enhancedKey = [
    goal,
    fitnessLevel,
    equipment,
    location,
    workoutTimeOfDay,
    dayOfWeek,
    Number(previousDayPerformance || 0).toFixed(1),
    goalExperienceInteraction,
    locationEquipmentInteraction,
  ].join('|');

  const hierarchicalEnhancedRanked = model.hierarchical_lookup_enhanced?.[enhancedKey] || [];
  const hierarchicalEnhancedMatch = findBestExerciseMatch(
    hierarchicalEnhancedRanked,
    exerciseName,
    exerciseCategory,
    equipment,
  );
  if (hierarchicalEnhancedMatch) {
    return {
      probability: resolveDisplayProbability(hierarchicalEnhancedMatch),
      rawProbability: Number(hierarchicalEnhancedMatch.probability || 0),
      categoryProbability: Number(hierarchicalEnhancedMatch.category_probability || 0),
      withinCategoryProbability: Number(hierarchicalEnhancedMatch.within_category_probability || 0),
      source: 'hierarchical_enhanced',
    };
  }

  const enhancedRanked = model.lookup_enhanced?.[enhancedKey] || [];
  const enhancedMatch = findBestExerciseMatch(enhancedRanked, exerciseName, exerciseCategory, equipment);
  if (enhancedMatch) {
    return {
      probability: resolveDisplayProbability(enhancedMatch),
      rawProbability: Number(enhancedMatch.probability || 0),
      categoryProbability: 0,
      withinCategoryProbability: 0,
      source: 'enhanced_lookup',
    };
  }

  const hierarchicalKey = `${goal}|${fitnessLevel}|${equipment}`;
  const hierarchicalRanked = model.hierarchical_lookup?.[hierarchicalKey] || [];
  const hierarchicalMatch = findBestExerciseMatch(hierarchicalRanked, exerciseName, exerciseCategory, equipment);
  if (hierarchicalMatch) {
    return {
      probability: resolveDisplayProbability(hierarchicalMatch),
      rawProbability: Number(hierarchicalMatch.probability || 0),
      categoryProbability: Number(hierarchicalMatch.category_probability || 0),
      withinCategoryProbability: Number(hierarchicalMatch.within_category_probability || 0),
      source: 'hierarchical_basic',
    };
  }

  const key = `${goal}|${fitnessLevel}|${equipment}`;
  const ranked = model.lookup?.[key] || [];
  const match = findBestExerciseMatch(ranked, exerciseName, exerciseCategory, equipment);
  return {
    probability: resolveDisplayProbability(match),
    rawProbability: Number(match?.probability || 0),
    categoryProbability: 0,
    withinCategoryProbability: 0,
    source: 'basic_lookup',
  };
};

const getPredictedProbability = (params) => {
  const details = getPredictionDetails(params);
  return details.probability;
};

module.exports = {
  getModelStatus,
  getPredictionDetails,
  getPredictedProbability,
};
