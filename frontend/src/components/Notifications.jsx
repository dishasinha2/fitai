import { useEffect, useState } from 'react';
import Layout from './Layout';
import api from '../lib/api';

const weekdayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [todaysReminders, setTodaysReminders] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    type: 'workout',
    timeOfDay: '07:00',
    days: ['Mon', 'Tue', 'Wed'],
  });

  const loadData = async () => {
    try {
      const [notificationResponse, reminderResponse] = await Promise.all([
        api.get('/notifications'),
        api.get('/reminders'),
      ]);
      setNotifications(notificationResponse.data.notifications || []);
      setUnreadCount(notificationResponse.data.unreadCount || 0);
      setTodaysReminders(notificationResponse.data.todaysReminders || []);
      setReminders(reminderResponse.data || []);
    } catch (_error) {
      setNotifications([]);
      setUnreadCount(0);
      setTodaysReminders([]);
      setReminders([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day],
    }));
  };

  const handleCreateReminder = async (event) => {
    event.preventDefault();
    await api.post('/reminders', {
      title: form.title,
      type: form.type,
      timeOfDay: form.timeOfDay,
      days: form.days,
      enabled: true,
    });
    setForm({
      title: '',
      type: 'workout',
      timeOfDay: '07:00',
      days: ['Mon', 'Tue', 'Wed'],
    });
    setMessage('Reminder saved successfully.');
    await loadData();
  };

  const toggleReminder = async (reminder) => {
    await api.put(`/reminders/${reminder._id}`, {
      ...reminder,
      timeOfDay: reminder.timeOfDay,
      enabled: !reminder.enabled,
      days: reminder.days,
    });
    setMessage(`Reminder ${reminder.enabled ? 'disabled' : 'enabled'}.`);
    await loadData();
  };

  const deleteReminder = async (reminderId) => {
    await api.delete(`/reminders/${reminderId}`);
    setMessage('Reminder deleted.');
    await loadData();
  };

  const markAsRead = async (notificationId) => {
    await api.post(`/notifications/${notificationId}/read`);
    await loadData();
  };

  const markAllAsRead = async () => {
    await api.post('/notifications/read-all');
    setMessage('All notifications marked as read.');
    await loadData();
  };

  return (
    <Layout
      title="Notifications and Reminders"
      subtitle="Configure workout and meal reminders while reviewing in-app activity updates from workouts, diet, and other FitAI actions."
      heroLabel="Stay On Track"
      heroImage="https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=1600&q=80"
    >
      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Today's Schedule</p>
            <h2 className="fitai-ref-card-title mt-3">Upcoming reminders</h2>
            <div className="mt-5 space-y-3">
              {todaysReminders.length === 0 ? (
                <p className="text-sm text-slate-400">No active reminders scheduled for today.</p>
              ) : (
                todaysReminders.map((reminder) => (
                  <div key={reminder._id} className="fitai-ref-app-card-soft p-4">
                    <p className="text-lg font-semibold text-white">{reminder.title}</p>
                    <p className="mt-2 text-sm capitalize text-slate-400">
                      {reminder.type} | {reminder.timeOfDay}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Reminder Builder</p>
            <h2 className="fitai-ref-card-title mt-3">Create a reminder</h2>

            <form onSubmit={handleCreateReminder} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Morning workout reminder"
                  className="fitai-ref-input"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Type</span>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="fitai-ref-input"
                  >
                    <option value="workout">Workout</option>
                    <option value="meal">Meal</option>
                    <option value="water">Hydration</option>
                    <option value="sleep">Recovery</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Time</span>
                  <input
                    name="timeOfDay"
                    type="time"
                    value={form.timeOfDay}
                    onChange={handleChange}
                    className="fitai-ref-input"
                  />
                </label>
              </div>

              <div>
                <span className="mb-2 block text-sm text-slate-300">Days</span>
                <div className="flex flex-wrap gap-2">
                  {weekdayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        form.days.includes(day)
                          ? 'fitai-ref-action text-white'
                          : 'fitai-ref-action-secondary text-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="fitai-ref-action px-6 py-3 font-semibold text-white">
                Save Reminder
              </button>
            </form>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Active Reminders</p>
            <div className="mt-5 space-y-3">
              {reminders.map((reminder) => (
                <div key={reminder._id} className="fitai-ref-app-card-soft p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{reminder.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {reminder.type} | {reminder.timeOfDay} | {reminder.days.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleReminder(reminder)}
                        className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200"
                      >
                        {reminder.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReminder(reminder._id)}
                        className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && <p className="text-sm text-slate-400">No reminders yet.</p>}
            </div>
          </div>
        </section>

        <section className="fitai-ref-app-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="fitai-ref-kicker">Notification Center</p>
              <h2 className="fitai-ref-card-title mt-2">Activity updates</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="fitai-ref-profile-box text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">Unread</p>
                <p className="mt-1 text-xl font-semibold text-white">{unreadCount}</p>
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="fitai-ref-action-secondary px-4 py-3 text-sm font-medium"
                >
                  Mark All Read
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {notifications.map((notification) => (
              <div key={notification._id} className="fitai-ref-app-card-soft p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-white">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="rounded-full bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{notification.body}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {notification.kind} | {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification._id)}
                      className="rounded-2xl border border-fuchsia-400/30 px-4 py-3 text-sm font-medium text-fuchsia-100"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-sm text-slate-400">No notifications yet.</p>}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Notifications;
