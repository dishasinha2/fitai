const express = require('express');
const authMiddleware = require('../middleware/auth');
const { createNotification, db, mapNotificationRow, mapReminderRow } = require('../db');
const { getDayKey } = require('../services/analytics');

const router = express.Router();
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const maybeGenerateDueReminderNotifications = (userId, reminders = []) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayKey = getDayKey(now);

  reminders.forEach((reminder) => {
    const [hours, minutes] = String(reminder.timeOfDay || '00:00')
      .split(':')
      .map((value) => Number(value) || 0);
    const reminderMinutes = hours * 60 + minutes;
    const isDue = currentMinutes >= reminderMinutes;

    if (!isDue) {
      return;
    }

    const alreadyDelivered = db
      .prepare('SELECT id FROM reminder_delivery_logs WHERE user_id = ? AND reminder_id = ? AND day_key = ?')
      .get(Number(userId), Number(reminder.id), dayKey);

    if (alreadyDelivered) {
      return;
    }

    createNotification({
      userId,
      title: `Reminder: ${reminder.title}`,
      body: `Your ${reminder.type} reminder is due now for ${reminder.timeOfDay}.`,
      kind: 'reminder',
    });

    db.prepare(`
      INSERT INTO reminder_delivery_logs (
        user_id,
        reminder_id,
        day_key,
        delivered_at
      ) VALUES (?, ?, ?, ?)
    `).run(Number(userId), Number(reminder.id), dayKey, now.toISOString());
  });
};

router.get('/', authMiddleware, (req, res) => {
  try {
    const reminders = db
      .prepare('SELECT * FROM reminders WHERE user_id = ? AND is_enabled = 1 ORDER BY time_of_day ASC')
      .all(Number(req.user.id))
      .map(mapReminderRow);
    const todayName = weekdayNames[new Date().getDay()];
    const todaysReminders = reminders.filter((item) => item.days.includes(todayName));
    maybeGenerateDueReminderNotifications(req.user.id, todaysReminders);
    const notifications = db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(Number(req.user.id))
      .map(mapNotificationRow);

    res.json({
      unreadCount: notifications.filter((item) => !item.isRead).length,
      notifications,
      todaysReminders,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:notificationId/read', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
      Number(req.params.notificationId),
      Number(req.user.id),
    );

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/read-all', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(Number(req.user.id));
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
