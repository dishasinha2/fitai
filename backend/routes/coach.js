const express = require('express');
const authMiddleware = require('../middleware/auth');
const { db, getUserById, mapDietPlanRow, mapProgressRow, mapReminderRow, mapRewardRow, mapWorkoutRow } = require('../db');
const { buildCoachCheckIn, answerCoachQuestion } = require('../services/coachEngine');
const { tryLlmCoachAnswer, tryLlmCoachCheckIn } = require('../services/llmCoachEngine');
const { buildProgressSummary } = require('../services/analytics');
const { buildRecommendation } = require('../services/recommendationEngine');

const router = express.Router();

const buildPreviewCoachPayload = (payload, mode) => ({
  ...payload,
  preview: true,
  message: mode === 'check-in' ? 'Sign in for personalized coaching insights' : 'Sign in for personalized FitAI coach answers',
  demoProfile: {
    name: 'Demo Athlete',
    age: 26,
    weight: 68,
    goal: 'maintenance',
    experience: 'beginner',
    location: 'gym',
  },
  sampleData: {
    recentWorkouts: 6,
    streakDays: 3,
    consistencyScore: 72,
    coachMode: mode,
  },
  cta: {
    primary: {
      label: 'Create account',
      path: '/signup',
    },
    secondary: {
      label: 'Log in',
      path: '/login',
    },
  },
});

const buildPreviewCoachContext = async () => {
  const user = {
    id: 'preview-user',
    name: 'Preview User',
    fitnessGoal: 'maintenance',
    activityLevel: 'beginner',
    location: 'gym',
    preferences: {
      workoutDaysPerWeek: 4,
      sessionDuration: 45,
    },
  };

  const recommendation = await buildRecommendation({ user, previousWorkouts: [] });

  return {
    user,
    rewards: {
      streak: 3,
      points: 120,
      badges: [],
    },
    reminders: [
      {
        title: 'Evening workout',
        timeOfDay: '18:30',
      },
    ],
    recommendation,
    summary: {
      totalWorkouts: 6,
      consistencyScore: 72,
      rewardPoints: 120,
      bestWorkoutDuration: 52,
      averageWorkoutDuration: 41,
    },
    adherence: {
      plan: {
        meals: ['Breakfast', 'Lunch', 'Dinner'],
      },
      completionRate: 67,
      weeklyCompletionRate: 71,
      completedToday: ['Breakfast', 'Lunch'],
    },
  };
};

const loadCoachContext = async (userId) => {
  const numericUserId = Number(userId);
  const user = getUserById(numericUserId);
  const workouts = db.prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC').all(numericUserId).map(mapWorkoutRow);
  const rewards = db.prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY awarded_at DESC').all(numericUserId).map(mapRewardRow);
  const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? AND is_enabled = 1 ORDER BY time_of_day ASC').all(numericUserId).map(mapReminderRow);
  const progressLogs = db
    .prepare('SELECT * FROM progress_logs WHERE user_id = ? ORDER BY date ASC')
    .all(numericUserId)
    .map(mapProgressRow);
  const latestDietPlan = mapDietPlanRow(
    db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(numericUserId),
  );
  const adherenceRows = latestDietPlan
    ? db
        .prepare('SELECT meal_name, day_key FROM diet_adherence WHERE user_id = ? AND diet_plan_id = ?')
        .all(numericUserId, Number(latestDietPlan.id))
    : [];
  const todayKey = new Date().toISOString().split('T')[0];
  const recommendation = await buildRecommendation({ user, previousWorkouts: workouts.slice(0, 5) });
  const summary = buildProgressSummary({
    user,
    workouts: workouts.slice().reverse(),
    progressLogs,
    rewards,
  });

  return {
    user,
    rewards: {
      streak: summary.consistencyScore ? Math.round((summary.consistencyScore / 100) * 7) : 0,
      points: summary.rewardPoints || 0,
      badges: rewards,
    },
    reminders,
    recommendation,
    summary,
    adherence: {
      plan: latestDietPlan,
      completionRate: latestDietPlan
        ? Math.round((adherenceRows.filter((item) => item.day_key === todayKey).length / Math.max(1, latestDietPlan.meals.length)) * 100)
        : 0,
      completedToday: adherenceRows.filter((item) => item.day_key === todayKey).map((item) => item.meal_name),
    },
  };
};

router.get('/check-in', authMiddleware.optionalAuthMiddleware, async (req, res) => {
  try {
    const isPreview = !req.user?.id;
    const context = isPreview ? await buildPreviewCoachContext() : await loadCoachContext(req.user.id);
    const fallback = buildCoachCheckIn(context);

    try {
      const llmResponse = await tryLlmCoachCheckIn(context);
      res.json(isPreview ? buildPreviewCoachPayload(llmResponse || fallback, 'check-in') : llmResponse || fallback);
    } catch (_error) {
      res.json(isPreview ? buildPreviewCoachPayload(fallback, 'check-in') : fallback);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/ask', authMiddleware.optionalAuthMiddleware, async (req, res) => {
  const { question = '' } = req.body || {};

  try {
    if (!String(question).trim()) {
      return res.status(400).json({ error: 'Ask FitAI Coach a question first.' });
    }

    const isPreview = !req.user?.id;
    const context = isPreview ? await buildPreviewCoachContext() : await loadCoachContext(req.user.id);
    const fallback = answerCoachQuestion({ question, ...context });

    try {
      const llmResponse = await tryLlmCoachAnswer({ question, ...context });
      res.json(isPreview ? buildPreviewCoachPayload(llmResponse || fallback, 'ask') : llmResponse || fallback);
    } catch (_error) {
      res.json(isPreview ? buildPreviewCoachPayload(fallback, 'ask') : fallback);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
