const express = require('express');
const Progress = require('../models/Progress');
const Reward = require('../models/Reward');
const Workout = require('../models/Workout');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { buildProgressSummary } = require('../services/analytics');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [user, progressLogs, workouts, rewards] = await Promise.all([
      User.findById(req.user.id),
      Progress.find({ user: req.user.id }).sort({ date: 1 }),
      Workout.find({ user: req.user.id }).sort({ date: 1 }),
      Reward.find({ user: req.user.id }).sort({ awardedAt: -1 }),
    ]);

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
    const workoutCount = await Workout.countDocuments({ user: req.user.id });
    const workouts = await Workout.find({ user: req.user.id });
    const totalVolume = workouts.reduce(
      (sum, workout) => sum + Number(workout.totalSets || 0) * Number(workout.totalReps || 0),
      0,
    );

    const progress = await Progress.create({
      user: req.user.id,
      weight,
      bodyFat,
      measurements,
      notes,
      workoutCount,
      totalVolume,
      consistencyScore: Math.min(100, workoutCount * 10),
    });

    await User.findByIdAndUpdate(req.user.id, { weight });

    res.status(201).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
