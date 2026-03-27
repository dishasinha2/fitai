const { db, initDatabase } = require('./db');

try {
  initDatabase();
  const exerciseCount = db.prepare('SELECT COUNT(*) AS count FROM exercises').get().count;
  console.log(`FitAI SQLite database ready with ${exerciseCount} exercises.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
