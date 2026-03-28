const express = require('express');
const { db, mapContactSubmissionRow } = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.get('/', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const submissions = db
      .prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC')
      .all()
      .map(mapContactSubmissionRow);

    const summary = {
      total: submissions.length,
      demo: submissions.filter((item) => item.interest === 'demo').length,
      premium: submissions.filter((item) => item.interest === 'premium').length,
      partnership: submissions.filter((item) => item.interest === 'partnership').length,
      support: submissions.filter((item) => item.interest === 'support').length,
    };

    return res.json({
      submissions,
      summary,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const { name, email, company, interest, message } = req.body || {};

  try {
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!interest?.trim()) {
      return res.status(400).json({ error: 'Please choose what you are contacting us about.' });
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO contact_submissions (
          name,
          email,
          company,
          interest,
          message,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        name.trim(),
        email.trim().toLowerCase(),
        company?.trim() || '',
        interest.trim(),
        message?.trim() || '',
        createdAt,
      );

    const submission = mapContactSubmissionRow(
      db.prepare('SELECT * FROM contact_submissions WHERE id = ?').get(result.lastInsertRowid),
    );

    return res.status(201).json({
      message: 'Thanks! Your request has been saved and the FitAI team can follow up from the dashboard demo queue.',
      submission,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
