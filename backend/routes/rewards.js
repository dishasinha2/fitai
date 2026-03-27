const express = require('express');
const authMiddleware = require('../middleware/auth');
const { calculateStreak, syncRewardsForStreak } = require('../services/analytics');
const { db, mapRewardRow, mapWorkoutRow } = require('../db');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const streak = calculateStreak(workouts);
    const rewards = db
      .prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY awarded_at DESC')
      .all(Number(req.user.id))
      .map(mapRewardRow);

    res.json({
      streak,
      points: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
      badges: rewards,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const streak = calculateStreak(workouts);
    const awarded = await syncRewardsForStreak(req.user.id, streak);
    const rewards = db
      .prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY awarded_at DESC')
      .all(Number(req.user.id))
      .map(mapRewardRow);

    res.json({
      streak,
      awarded,
      badges: rewards,
      points: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
