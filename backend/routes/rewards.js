const express = require('express');
const Reward = require('../models/Reward');
const Workout = require('../models/Workout');
const authMiddleware = require('../middleware/auth');
const { calculateStreak, syncRewardsForStreak } = require('../services/analytics');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
    const streak = calculateStreak(workouts);
    const rewards = await Reward.find({ user: req.user.id }).sort({ awardedAt: -1 });

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
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
    const streak = calculateStreak(workouts);
    const awarded = await syncRewardsForStreak(req.user.id, streak);
    const rewards = await Reward.find({ user: req.user.id }).sort({ awardedAt: -1 });

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
