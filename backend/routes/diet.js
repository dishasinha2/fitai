const express = require('express');
const authMiddleware = require('../middleware/auth');
const { buildDietPlan } = require('../services/dietEngine');
const { db, getUserById, mapDietPlanRow, toJson } = require('../db');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const dietPlan = mapDietPlanRow(
      db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(Number(req.user.id)),
    );
    res.json(dietPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
    const plan = buildDietPlan(user);
    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO diet_plans (
          user_id,
          goal,
          bmi,
          bmi_category,
          activity_level,
          daily_calories,
          hydration_liters,
          macros_json,
          meals_json,
          notes_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(req.user.id),
        plan.goal,
        plan.bmi,
        plan.bmiCategory,
        plan.activityLevel,
        plan.dailyCalories,
        plan.hydrationLiters,
        toJson(plan.macros, {}),
        toJson(plan.meals, []),
        toJson(plan.notes, []),
        createdAt,
      );

    const savedPlan = mapDietPlanRow(
      db.prepare('SELECT * FROM diet_plans WHERE id = ?').get(result.lastInsertRowid),
    );

    res.json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
