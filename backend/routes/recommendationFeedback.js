const express = require('express');
const authMiddleware = require('../middleware/auth');
const { db, toJson } = require('../db');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const {
    exerciseName = '',
    feedbackValue = 0,
    feedbackText = '',
    sourceScreen = 'dashboard',
    context = {},
  } = req.body || {};

  try {
    const normalizedName = String(exerciseName).trim();
    const numericFeedback = Number(feedbackValue);

    if (!normalizedName) {
      return res.status(400).json({ error: 'Exercise name is required.' });
    }

    if (![1, -1].includes(numericFeedback)) {
      return res.status(400).json({ error: 'Feedback value must be 1 or -1.' });
    }

    const createdAt = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO recommendation_feedback (
        user_id,
        exercise_name,
        feedback_value,
        feedback_text,
        source_screen,
        context_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(req.user.id),
      normalizedName,
      numericFeedback,
      String(feedbackText || '').trim(),
      String(sourceScreen || 'dashboard'),
      toJson(context, {}),
      createdAt,
    );

    return res.status(201).json({
      id: String(result.lastInsertRowid),
      exerciseName: normalizedName,
      feedbackValue: numericFeedback,
      feedbackText: String(feedbackText || '').trim(),
      sourceScreen,
      createdAt,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
