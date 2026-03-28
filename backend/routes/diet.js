const express = require('express');
const authMiddleware = require('../middleware/auth');
const { buildDietPlan } = require('../services/dietEngine');
const {
  createNotification,
  db,
  getUserById,
  mapDietAdherenceRow,
  mapDietGroceryItemRow,
  mapDietPlanRow,
  toJson,
} = require('../db');
const { getDayKey } = require('../services/analytics');

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

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const dietPlans = db
      .prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 10')
      .all(Number(req.user.id))
      .map(mapDietPlanRow);

    res.json(dietPlans);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/grocery-list', authMiddleware, (req, res) => {
  try {
    const dietPlan = mapDietPlanRow(
      db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(Number(req.user.id)),
    );

    if (!dietPlan) {
      return res.json({ items: [] });
    }

    const baseItems = [...new Set((dietPlan.meals || []).flatMap((meal) => meal.foods || []))];
    const persistedItems = db
      .prepare('SELECT * FROM diet_grocery_items WHERE user_id = ? AND diet_plan_id = ?')
      .all(Number(req.user.id), Number(dietPlan.id))
      .map(mapDietGroceryItemRow);
    const persistedMap = new Map(persistedItems.map((item) => [item.itemName, item]));

    const items = baseItems.map((item) => ({
      name: item,
      checked: persistedMap.get(item)?.checked || false,
    }));
    const completionRate = items.length
      ? Math.round((items.filter((item) => item.checked).length / items.length) * 100)
      : 0;

    return res.json({ items, dietPlanId: dietPlan._id, completionRate });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/grocery-list/toggle', authMiddleware, (req, res) => {
  const { dietPlanId, itemName, checked } = req.body || {};

  try {
    if (!dietPlanId || !itemName?.trim()) {
      return res.status(400).json({ error: 'Diet plan and grocery item are required.' });
    }

    const dietPlan = db
      .prepare('SELECT * FROM diet_plans WHERE id = ? AND user_id = ?')
      .get(Number(dietPlanId), Number(req.user.id));

    if (!dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found.' });
    }

    const updatedAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO diet_grocery_items (
        user_id,
        diet_plan_id,
        item_name,
        is_checked,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, diet_plan_id, item_name)
      DO UPDATE SET is_checked = excluded.is_checked, updated_at = excluded.updated_at
    `).run(Number(req.user.id), Number(dietPlanId), itemName.trim(), checked ? 1 : 0, updatedAt);

    return res.json({
      dietPlanId: String(dietPlanId),
      itemName: itemName.trim(),
      checked: Boolean(checked),
      updatedAt,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/adherence', authMiddleware, (req, res) => {
  try {
    const dietPlan = mapDietPlanRow(
      db.prepare('SELECT * FROM diet_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(Number(req.user.id)),
    );

    if (!dietPlan) {
      return res.json({ plan: null, entries: [], completionRate: 0 });
    }

    const entries = db
      .prepare('SELECT * FROM diet_adherence WHERE user_id = ? AND diet_plan_id = ? ORDER BY completed_at DESC')
      .all(Number(req.user.id), Number(dietPlan.id))
      .map(mapDietAdherenceRow);

    const todayEntries = entries.filter((item) => item.dayKey === getDayKey());
    const totalMeals = Math.max(1, dietPlan.meals.length);
    const completionRate = Math.round((todayEntries.length / totalMeals) * 100);
    const recentDayKeys = new Set(
      Array.from({ length: 7 }, (_, index) => {
        const current = new Date();
        current.setDate(current.getDate() - index);
        return getDayKey(current);
      }),
    );
    const weeklyEntries = entries.filter((item) => recentDayKeys.has(item.dayKey));
    const weeklyCompletionRate = Math.round((weeklyEntries.length / Math.max(1, totalMeals * 7)) * 100);

    return res.json({
      plan: dietPlan,
      entries,
      completionRate,
      weeklyCompletionRate,
      completedToday: todayEntries.map((item) => item.mealName),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/adherence', authMiddleware, (req, res) => {
  const { dietPlanId, mealName } = req.body || {};

  try {
    if (!dietPlanId || !mealName?.trim()) {
      return res.status(400).json({ error: 'Diet plan and meal name are required.' });
    }

    const dayKey = getDayKey();
    const existing = db
      .prepare(
        'SELECT * FROM diet_adherence WHERE user_id = ? AND diet_plan_id = ? AND meal_name = ? AND day_key = ?',
      )
      .get(Number(req.user.id), Number(dietPlanId), mealName.trim(), dayKey);

    if (existing) {
      return res.status(409).json({ error: 'This meal is already marked complete for today.' });
    }

    const completedAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO diet_adherence (
          user_id,
          diet_plan_id,
          meal_name,
          day_key,
          completed_at
        ) VALUES (?, ?, ?, ?, ?)
      `)
      .run(Number(req.user.id), Number(dietPlanId), mealName.trim(), dayKey, completedAt);

    createNotification({
      userId: req.user.id,
      title: 'Meal completed',
      body: `${mealName.trim()} has been added to today's diet adherence log.`,
      kind: 'diet',
    });

    return res.status(201).json(
      mapDietAdherenceRow(db.prepare('SELECT * FROM diet_adherence WHERE id = ?').get(result.lastInsertRowid)),
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
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

    createNotification({
      userId: req.user.id,
      title: 'New diet plan generated',
      body: `Your ${plan.goal.replace('_', ' ')} nutrition plan is ready with ${plan.dailyCalories} kcal.`,
      kind: 'diet',
    });

    res.json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
