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

const adminEmails = (process.env.ADMIN_EMAILS || 'admin@fitai.app')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

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
    role: row.role || 'user',
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

const mapContactSubmissionRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email,
    company: row.company || '',
    interest: row.interest,
    message: row.message || '',
    createdAt: row.created_at,
  };
};

const mapWorkoutTemplateRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    name: row.name,
    goal: row.goal || '',
    location: row.location || '',
    exercises: parseJson(row.exercises_json, []),
    createdAt: row.created_at,
  };
};

const mapReminderRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    title: row.title,
    type: row.type,
    timeOfDay: row.time_of_day,
    days: parseJson(row.days_json, []),
    enabled: Boolean(row.is_enabled),
    createdAt: row.created_at,
  };
};

const mapNotificationRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    title: row.title,
    body: row.body,
    kind: row.kind,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
};

const mapDietAdherenceRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    dietPlanId: String(row.diet_plan_id),
    mealName: row.meal_name,
    dayKey: row.day_key,
    completedAt: row.completed_at,
  };
};

const mapDietGroceryItemRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    dietPlanId: String(row.diet_plan_id),
    itemName: row.item_name,
    checked: Boolean(row.is_checked),
    updatedAt: row.updated_at,
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
      role TEXT DEFAULT 'user',
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

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      interest TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      goal TEXT,
      location TEXT,
      exercises_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      time_of_day TEXT NOT NULL,
      days_json TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      kind TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminder_delivery_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reminder_id INTEGER NOT NULL,
      day_key TEXT NOT NULL,
      delivered_at TEXT NOT NULL,
      UNIQUE (user_id, reminder_id, day_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_adherence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      diet_plan_id INTEGER NOT NULL,
      meal_name TEXT NOT NULL,
      day_key TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE (user_id, diet_plan_id, meal_name, day_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_grocery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      diet_plan_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      is_checked INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, diet_plan_id, item_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
    );
  `);

  const userColumns = db.prepare("PRAGMA table_info('users')").all();
  const hasRoleColumn = userColumns.some((column) => column.name === 'role');
  if (!hasRoleColumn) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  }

  if (adminEmails.length) {
    const placeholders = adminEmails.map(() => '?').join(', ');
    db.prepare(`UPDATE users SET role = 'admin' WHERE lower(email) IN (${placeholders})`).run(...adminEmails);
  }

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
        role,
        age,
        weight,
        height,
        fitness_goal,
        activity_level,
        location,
        preferences_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      user.name,
      user.email,
      user.password,
      adminEmails.includes(String(user.email).toLowerCase()) ? 'admin' : 'user',
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

const createNotification = ({ userId, title, body, kind = 'system' }) => {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO notifications (
        user_id,
        title,
        body,
        kind,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
    `)
    .run(Number(userId), title, body, kind, createdAt);

  return mapNotificationRow(db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid));
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
  mapContactSubmissionRow,
  mapWorkoutTemplateRow,
  mapReminderRow,
  mapNotificationRow,
  mapDietAdherenceRow,
  mapDietGroceryItemRow,
  createUser,
  getUserByEmail,
  getUserById,
  getUserWithPasswordByEmail,
  updateUserById,
  createNotification,
};
