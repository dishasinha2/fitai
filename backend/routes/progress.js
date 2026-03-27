const express = require('express');
const authMiddleware = require('../middleware/auth');
const { buildProgressSummary } = require('../services/analytics');
const {
  db,
  getUserById,
  mapProgressRow,
  mapRewardRow,
  mapWorkoutRow,
  toJson,
  updateUserById,
} = require('../db');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
    const progressLogs = db
      .prepare('SELECT * FROM progress_logs WHERE user_id = ? ORDER BY date ASC')
      .all(Number(req.user.id))
      .map(mapProgressRow);
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const rewards = db
      .prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY awarded_at DESC')
      .all(Number(req.user.id))
      .map(mapRewardRow);

    res.json({
      logs: progressLogs,
      summary: buildProgressSummary({ user, workouts, progressLogs, rewards }),
      workouts,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { weight, bodyFat, measurements, notes } = req.body;

  try {
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ?')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const workoutCount = workouts.length;
    const totalVolume = workouts.reduce(
      (sum, workout) => sum + Number(workout.totalSets || 0) * Number(workout.totalReps || 0),
      0,
    );

    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO progress_logs (
          user_id,
          date,
          weight,
          body_fat,
          workout_count,
          total_volume,
          consistency_score,
          measurements_json,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(req.user.id),
        createdAt,
        weight ?? null,
        bodyFat ?? null,
        workoutCount,
        totalVolume,
        Math.min(100, workoutCount * 10),
        toJson(measurements || {}, {}),
        notes || '',
      );

    const progress = mapProgressRow(
      db.prepare('SELECT * FROM progress_logs WHERE id = ?').get(result.lastInsertRowid),
    );

    if (weight !== undefined) {
      updateUserById(req.user.id, { weight });
    }

    res.status(201).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
