const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'fitai.sqlite');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const seededExercises = [
  {
    name: 'Bodyweight Squats',
    category: 'strength',
    equipment: 'none',
    location: 'home',
    intensity: 'moderate',
    muscleGroup: 'legs',
    youtubeId: 'aclHkVaku9U',
    instructions: 'Keep your chest up, hips back, and knees tracking over toes.',
    tags: ['beginner', 'no-equipment'],
  },
  {
    name: 'Push-ups',
    category: 'strength',
    equipment: 'none',
    location: 'both',
    intensity: 'moderate',
    muscleGroup: 'chest',
    youtubeId: 'IODxDxX7oi4',
    instructions: 'Brace your core and lower your chest under control.',
    tags: ['beginner', 'upper-body'],
  },
  {
    name: 'Mountain Climbers',
    category: 'conditioning',
    equipment: 'none',
    location: 'home',
    intensity: 'high',
    muscleGroup: 'core',
    youtubeId: 'nmwgirgXLYM',
    instructions: 'Drive knees forward quickly while keeping hips steady.',
    tags: ['fat-loss', 'home'],
  },
  {
    name: 'Plank',
    category: 'core',
    equipment: 'none',
    location: 'both',
    intensity: 'low',
    muscleGroup: 'core',
    youtubeId: 'pSHjTRCQxIw',
    instructions: 'Keep a straight line from shoulders to heels.',
    tags: ['stability', 'beginner'],
  },
  {
    name: 'Bench Press',
    category: 'strength',
    equipment: 'barbell',
    location: 'gym',
    intensity: 'high',
    muscleGroup: 'chest',
    youtubeId: 'gRVjAtPip0Y',
    instructions: 'Plant your feet firmly and press the bar in a controlled path.',
    tags: ['muscle-gain', 'gym'],
  },
  {
    name: 'Lat Pulldown',
    category: 'strength',
    equipment: 'machine',
    location: 'gym',
    intensity: 'moderate',
    muscleGroup: 'back',
    youtubeId: 'CAwf7n6Luuc',
    instructions: 'Pull elbows down and back while keeping your chest lifted.',
    tags: ['gym', 'back'],
  },
  {
    name: 'Treadmill Intervals',
    category: 'cardio',
    equipment: 'treadmill',
    location: 'gym',
    intensity: 'high',
    muscleGroup: 'full_body',
    youtubeId: 'hCDzSR6bW10',
    instructions: 'Alternate brisk recovery and fast intervals.',
    tags: ['fat-loss', 'cardio'],
  },
  {
    name: 'Mobility Flow',
    category: 'mobility',
    equipment: 'none',
    location: 'both',
    intensity: 'low',
    muscleGroup: 'full_body',
    youtubeId: '4BOTvaRaDjI',
    instructions: 'Move slowly through shoulder, hip, and spine ranges.',
    tags: ['warmup', 'recovery'],
  },
];

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const toJson = (value, fallback) => JSON.stringify(value ?? fallback);

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email,
    age: row.age,
    weight: row.weight,
    height: row.height,
    fitnessGoal: row.fitness_goal || 'maintenance',
    activityLevel: row.activity_level || 'beginner',
    location: row.location || 'home',
    preferences: parseJson(row.preferences_json, {
      workoutDaysPerWeek: 3,
      sessionDuration: 45,
      dietaryPreference: 'balanced',
      focusAreas: [],
    }),
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockUntil: row.lock_until,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
};

const mapExerciseRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    category: row.category,
    equipment: row.equipment,
    location: row.location,
    intensity: row.intensity,
    muscleGroup: row.muscle_group,
    youtubeId: row.youtube_id || '',
    instructions: row.instructions || '',
    tags: parseJson(row.tags_json, []),
  };
};

const mapWorkoutRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    date: row.date,
    dayKey: row.day_key,
    exercises: parseJson(row.exercises_json, []),
    totalDuration: row.total_duration || 0,
    totalSets: row.total_sets || 0,
    totalReps: row.total_reps || 0,
    estimatedCalories: row.estimated_calories || 0,
    location: row.location || '',
    aiSummary: row.ai_summary || '',
  };
};

const mapDietPlanRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    goal: row.goal,
    bmi: row.bmi,
    bmiCategory: row.bmi_category,
    activityLevel: row.activity_level,
    dailyCalories: row.daily_calories,
    hydrationLiters: row.hydration_liters,
    macros: parseJson(row.macros_json, {}),
    meals: parseJson(row.meals_json, []),
    notes: parseJson(row.notes_json, []),
    createdAt: row.created_at,
  };
};

const mapProgressRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    date: row.date,
    weight: row.weight,
    bodyFat: row.body_fat,
    workoutCount: row.workout_count || 0,
    totalVolume: row.total_volume || 0,
    consistencyScore: row.consistency_score || 0,
    measurements: parseJson(row.measurements_json, {}),
    notes: row.notes || '',
  };
};

const mapRewardRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    type: row.type,
    key: row.reward_key,
    title: row.title,
    description: row.description,
    points: row.points || 0,
    metadata: parseJson(row.metadata_json, {}),
    awardedAt: row.awarded_at,
  };
};

const defaultPreferences = {
  workoutDaysPerWeek: 3,
  sessionDuration: 45,
  dietaryPreference: 'balanced',
  focusAreas: [],
};

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      age INTEGER,
      weight REAL,
      height REAL,
      fitness_goal TEXT DEFAULT 'maintenance',
      activity_level TEXT DEFAULT 'beginner',
      location TEXT DEFAULT 'home',
      preferences_json TEXT NOT NULL,
      failed_login_attempts INTEGER DEFAULT 0,
      lock_until TEXT,
      last_login_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      equipment TEXT NOT NULL,
      location TEXT NOT NULL,
      intensity TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      youtube_id TEXT,
      instructions TEXT,
      tags_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      day_key TEXT NOT NULL,
      exercises_json TEXT NOT NULL,
      total_duration INTEGER DEFAULT 0,
      total_sets INTEGER DEFAULT 0,
      total_reps INTEGER DEFAULT 0,
      estimated_calories INTEGER DEFAULT 0,
      location TEXT,
      ai_summary TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal TEXT NOT NULL,
      bmi REAL NOT NULL,
      bmi_category TEXT NOT NULL,
      activity_level TEXT NOT NULL,
      daily_calories INTEGER NOT NULL,
      hydration_liters REAL NOT NULL,
      macros_json TEXT NOT NULL,
      meals_json TEXT NOT NULL,
      notes_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight REAL,
      body_fat REAL,
      workout_count INTEGER DEFAULT 0,
      total_volume INTEGER DEFAULT 0,
      consistency_score INTEGER DEFAULT 0,
      measurements_json TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reward_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      metadata_json TEXT NOT NULL,
      awarded_at TEXT NOT NULL,
      UNIQUE (user_id, reward_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const exerciseCount = db.prepare('SELECT COUNT(*) AS count FROM exercises').get().count;

  if (!exerciseCount) {
    const insertExercise = db.prepare(`
      INSERT INTO exercises (
        name,
        category,
        equipment,
        location,
        intensity,
        muscle_group,
        youtube_id,
        instructions,
        tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedExercises = db.transaction((items) => {
      for (const exercise of items) {
        insertExercise.run(
          exercise.name,
          exercise.category,
          exercise.equipment,
          exercise.location,
          exercise.intensity,
          exercise.muscleGroup,
          exercise.youtubeId,
          exercise.instructions,
          toJson(exercise.tags, []),
        );
      }
    });

    seedExercises(seededExercises);
  }
};

const createUser = (user) => {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO users (
        name,
        email,
        password,
        age,
        weight,
        height,
        fitness_goal,
        activity_level,
        location,
        preferences_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      user.name,
      user.email,
      user.password,
      user.age ?? null,
      user.weight ?? null,
      user.height ?? null,
      user.fitnessGoal || 'maintenance',
      user.activityLevel || 'beginner',
      user.location || 'home',
      toJson({ ...defaultPreferences, ...(user.preferences || {}) }, defaultPreferences),
      createdAt,
    );

  return mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid));
};

const getUserByEmail = (email) => mapUserRow(db.prepare('SELECT * FROM users WHERE email = ?').get(email));
const getUserById = (id) => mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)));

const getUserWithPasswordByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email);

const updateUserById = (id, updates = {}) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));

  if (!existing) {
    return null;
  }

  const nextPreferences =
    updates.preferences === undefined
      ? parseJson(existing.preferences_json, defaultPreferences)
      : { ...defaultPreferences, ...(updates.preferences || {}) };

  db.prepare(`
    UPDATE users
    SET
      name = ?,
      age = ?,
      weight = ?,
      height = ?,
      fitness_goal = ?,
      activity_level = ?,
      location = ?,
      preferences_json = ?
    WHERE id = ?
  `).run(
    updates.name ?? existing.name,
    updates.age ?? existing.age,
    updates.weight ?? existing.weight,
    updates.height ?? existing.height,
    updates.fitnessGoal ?? existing.fitness_goal,
    updates.activityLevel ?? existing.activity_level,
    updates.location ?? existing.location,
    toJson(nextPreferences, defaultPreferences),
    Number(id),
  );

  return getUserById(id);
};

module.exports = {
  db,
  DB_PATH,
  initDatabase,
  parseJson,
  toJson,
  defaultPreferences,
  mapUserRow,
  mapExerciseRow,
  mapWorkoutRow,
  mapDietPlanRow,
  mapProgressRow,
  mapRewardRow,
  createUser,
  getUserByEmail,
  getUserById,
  getUserWithPasswordByEmail,
  updateUserById,
};
