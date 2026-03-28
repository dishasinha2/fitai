const express = require('express');
const authMiddleware = require('../middleware/auth');
const { createNotification, db, mapReminderRow, toJson } = require('../db');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const reminders = db
      .prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC')
      .all(Number(req.user.id))
      .map(mapReminderRow);

    res.json(reminders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const { title, type = 'general', timeOfDay = '07:00', days = [], enabled = true } = req.body || {};

  try {
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Reminder title is required.' });
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO reminders (
          user_id,
          title,
          type,
          time_of_day,
          days_json,
          is_enabled,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        Number(req.user.id),
        title.trim(),
        type,
        timeOfDay,
        toJson(days, []),
        enabled ? 1 : 0,
        createdAt,
      );

    createNotification({
      userId: req.user.id,
      title: 'Reminder created',
      body: `${title.trim()} is set for ${timeOfDay} on ${days.join(', ') || 'selected days'}.`,
      kind: 'reminder',
    });

    res.status(201).json(
      mapReminderRow(db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid)),
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:reminderId', authMiddleware, (req, res) => {
  const { title, type, timeOfDay, days, enabled } = req.body || {};

  try {
    const existing = db
      .prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?')
      .get(Number(req.params.reminderId), Number(req.user.id));

    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    db.prepare(`
      UPDATE reminders
      SET title = ?, type = ?, time_of_day = ?, days_json = ?, is_enabled = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title?.trim() || existing.title,
      type || existing.type,
      timeOfDay || existing.time_of_day,
      toJson(days ?? JSON.parse(existing.days_json || '[]'), []),
      enabled === undefined ? existing.is_enabled : enabled ? 1 : 0,
      Number(req.params.reminderId),
      Number(req.user.id),
    );

    createNotification({
      userId: req.user.id,
      title: 'Reminder updated',
      body: `${(title?.trim() || existing.title)} was ${enabled === false ? 'disabled' : 'updated'} in your reminder schedule.`,
      kind: 'reminder',
    });

    res.json(
      mapReminderRow(
        db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(
          Number(req.params.reminderId),
          Number(req.user.id),
        ),
      ),
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:reminderId', authMiddleware, (req, res) => {
  try {
    const existing = db
      .prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?')
      .get(Number(req.params.reminderId), Number(req.user.id));

    db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(
      Number(req.params.reminderId),
      Number(req.user.id),
    );

    if (existing) {
      createNotification({
        userId: req.user.id,
        title: 'Reminder deleted',
        body: `${existing.title} was removed from your schedule.`,
        kind: 'reminder',
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
