const express = require('express');
const axios = require('axios');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { buildRecommendation } = require('../services/recommendationEngine');
const { calculateWorkoutTotals, getDayKey, calculateStreak, syncRewardsForStreak } = require('../services/analytics');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exercises', async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ category: 1, name: 1 });
    res.json(exercises);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recentWorkouts = await Workout.find({ user: req.user.id }).sort({ date: -1 }).limit(5);
    const plan = await buildRecommendation({ user, previousWorkouts: recentWorkouts });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/session/start', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recentWorkouts = await Workout.find({ user: req.user.id }).sort({ date: -1 }).limit(5);
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
    const workout = await Workout.create({
      user: req.user.id,
      date: new Date(),
      dayKey: getDayKey(),
      exercises,
      location,
      aiSummary,
      ...totals,
    });

    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
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
    const exercise = await Exercise.findById(req.params.exerciseId);
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
