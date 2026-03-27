const express = require('express');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { buildDietPlan } = require('../services/dietEngine');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const dietPlan = await DietPlan.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(dietPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plan = buildDietPlan(user);
    const savedPlan = await DietPlan.create({
      user: req.user.id,
      ...plan,
    });

    res.json(savedPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
