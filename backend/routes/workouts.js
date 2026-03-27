const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { buildRecommendation } = require('../services/recommendationEngine');
const { calculateWorkoutTotals, getDayKey, calculateStreak, syncRewardsForStreak } = require('../services/analytics');
const {
  db,
  mapExerciseRow,
  mapWorkoutTemplateRow,
  mapWorkoutRow,
  getUserById,
  toJson,
} = require('../db');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    res.json(workouts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exercises', async (req, res) => {
  try {
    const exercises = db.prepare('SELECT * FROM exercises ORDER BY category ASC, name ASC').all().map(mapExerciseRow);
    res.json(exercises);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/templates', authMiddleware, (req, res) => {
  try {
    const templates = db
      .prepare('SELECT * FROM workout_templates WHERE user_id = ? ORDER BY created_at DESC')
      .all(Number(req.user.id))
      .map(mapWorkoutTemplateRow);

    res.json(templates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/templates', authMiddleware, (req, res) => {
  const { name, exercises = [], goal = '', location = '' } = req.body || {};

  try {
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Template name is required.' });
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Add at least one exercise to save a template.' });
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO workout_templates (
          user_id,
          name,
          goal,
          location,
          exercises_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(req.user.id),
        name.trim(),
        goal || '',
        location || '',
        toJson(exercises, []),
        createdAt,
      );

    const template = mapWorkoutTemplateRow(
      db.prepare('SELECT * FROM workout_templates WHERE id = ?').get(result.lastInsertRowid),
    );

    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
    const recentWorkouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 5')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const plan = await buildRecommendation({ user, previousWorkouts: recentWorkouts });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/session/start', authMiddleware, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
    const recentWorkouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 5')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const recommendation = await buildRecommendation({ user, previousWorkouts: recentWorkouts });

    res.json({
      workflow: [
        '1. User logs in',
        '2. Sets goals and profile',
        '3. Starts workout session',
        '4. Tracks exercises',
        '5. AI suggests next exercise',
        '6. Shows guidance video',
        '7. Updates progress and rewards',
        '8. Repeat cycle',
      ],
      recommendation,
      sessionDefaults: {
        location: user.location,
        sessionDuration: user.preferences?.sessionDuration || 45,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { exercises = [], location, aiSummary = '' } = req.body;

  try {
    const totals = calculateWorkoutTotals(exercises);
    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO workouts (
          user_id,
          date,
          day_key,
          exercises_json,
          total_duration,
          total_sets,
          total_reps,
          estimated_calories,
          location,
          ai_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(req.user.id),
        createdAt,
        getDayKey(new Date(createdAt)),
        toJson(exercises, []),
        totals.totalDuration,
        totals.totalSets,
        totals.totalReps,
        totals.estimatedCalories,
        location || '',
        aiSummary || '',
      );

    const workout = mapWorkoutRow(db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid));
    const workouts = db
      .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC')
      .all(Number(req.user.id))
      .map(mapWorkoutRow);
    const streak = calculateStreak(workouts);
    const newRewards = await syncRewardsForStreak(req.user.id, streak);

    res.status(201).json({
      workout,
      streak,
      rewardsAwarded: newRewards,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/guidance/:exerciseId', async (req, res) => {
  try {
    const exercise = mapExerciseRow(
      db.prepare('SELECT * FROM exercises WHERE id = ?').get(Number(req.params.exerciseId)),
    );
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }

    if (exercise.youtubeId) {
      return res.json({
        exercise: exercise.name,
        youtubeId: exercise.youtubeId,
        embedUrl: `https://www.youtube.com/embed/${exercise.youtubeId}`,
        source: 'seeded-video',
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.json({
        exercise: exercise.name,
        youtubeId: '',
        embedUrl: '',
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise form`)}`,
        source: 'youtube-search-fallback',
      });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${exercise.name} exercise form`,
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 1,
        type: 'video',
      },
    });

    const videoId = response.data.items?.[0]?.id?.videoId || '';
    return res.json({
      exercise: exercise.name,
      youtubeId: videoId,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
      source: 'youtube-api',
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
