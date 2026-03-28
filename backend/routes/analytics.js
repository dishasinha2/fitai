const express = require('express');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  db,
  mapContactSubmissionRow,
  mapProgressRow,
  mapRewardRow,
  mapUserRow,
  mapWorkoutRow,
} = require('../db');

const router = express.Router();

router.get('/overview', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map(mapUserRow);
    const workouts = db.prepare('SELECT * FROM workouts ORDER BY date DESC').all().map(mapWorkoutRow);
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY awarded_at DESC').all().map(mapRewardRow);
    const progressLogs = db.prepare('SELECT * FROM progress_logs ORDER BY date DESC').all().map(mapProgressRow);
    const contacts = db
      .prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC')
      .all()
      .map(mapContactSubmissionRow);
    const reminders = db.prepare('SELECT COUNT(*) AS count FROM reminders').get().count;
    const unreadNotifications = db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0').get().count;
    const dietPlans = db.prepare('SELECT COUNT(*) AS count FROM diet_plans').get().count;

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const current = new Date();
      current.setDate(current.getDate() - (6 - index));
      return current.toISOString().split('T')[0];
    });

    const workoutsByDay = last7Days.map((day) => ({
      day,
      count: workouts.filter((item) => item.dayKey === day).length,
    }));

    const signupsByGoal = ['fat_loss', 'muscle_gain', 'maintenance'].map((goal) => ({
      goal,
      count: users.filter((user) => user.fitnessGoal === goal).length,
    }));

    const topTemplateSignal = workouts.reduce((accumulator, workout) => {
      workout.exercises.forEach((exercise) => {
        accumulator[exercise.name] = (accumulator[exercise.name] || 0) + 1;
      });
      return accumulator;
    }, {});

    const topExercises = Object.entries(topTemplateSignal)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      metrics: {
        totalUsers: users.length,
        totalWorkouts: workouts.length,
        totalContacts: contacts.length,
        rewardPointsIssued: rewards.reduce((sum, reward) => sum + Number(reward.points || 0), 0),
        averageWorkoutDuration: workouts.length
          ? Math.round(workouts.reduce((sum, workout) => sum + Number(workout.totalDuration || 0), 0) / workouts.length)
          : 0,
        latestProgressEntries: progressLogs.length,
        totalDietPlans: dietPlans,
        activeReminders: reminders,
        unreadNotifications,
      },
      workoutsByDay,
      signupsByGoal,
      topExercises,
      latestContacts: contacts.slice(0, 5),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
