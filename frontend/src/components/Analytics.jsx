import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Layout from './Layout';
import api from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function Analytics() {
  const [data, setData] = useState({
    metrics: {},
    workoutsByDay: [],
    signupsByGoal: [],
    topExercises: [],
    latestContacts: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get('/analytics/overview');
        setData(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Unable to load analytics.');
      }
    };

    loadAnalytics();
  }, []);

  const workoutsChart = {
    labels: data.workoutsByDay.map((item) => item.day),
    datasets: [
      {
        label: 'Workouts',
        data: data.workoutsByDay.map((item) => item.count),
        backgroundColor: 'rgba(34, 211, 238, 0.65)',
        borderRadius: 16,
      },
    ],
  };

  const goalsChart = {
    labels: data.signupsByGoal.map((item) => item.goal.replace('_', ' ')),
    datasets: [
      {
        label: 'Users',
        data: data.signupsByGoal.map((item) => item.count),
        backgroundColor: 'rgba(217, 70, 239, 0.65)',
        borderRadius: 16,
      },
    ],
  };

  return (
    <Layout
      title="Analytics"
      subtitle="Track product activity across users, workouts, rewards, public requests, and goal distribution in one admin-style view."
      heroLabel="Platform Metrics"
      heroImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80"
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {[
            ['Users', data.metrics.totalUsers || 0],
            ['Workouts', data.metrics.totalWorkouts || 0],
            ['Contacts', data.metrics.totalContacts || 0],
            ['Reward Points', data.metrics.rewardPointsIssued || 0],
            ['Avg Duration', `${data.metrics.averageWorkoutDuration || 0} min`],
            ['Progress Logs', data.metrics.latestProgressEntries || 0],
            ['Diet Plans', data.metrics.totalDietPlans || 0],
            ['Reminders', data.metrics.activeReminders || 0],
            ['Unread Alerts', data.metrics.unreadNotifications || 0],
            ['Reco Feedback', data.metrics.recommendationFeedback || 0],
          ].map(([label, value]) => (
            <div key={label} className="fitai-ref-stat-block p-5">
              <p className="fitai-ref-stat-label">{label}</p>
              <p className="fitai-ref-stat-value mt-3">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="fitai-ref-app-card chart-shell p-6">
            <p className="fitai-ref-kicker">Workout Activity</p>
            <h2 className="fitai-ref-card-title mt-3">Workouts across the last 7 days</h2>
            <div className="mt-6">
              <Bar data={workoutsChart} />
            </div>
          </div>

          <div className="fitai-ref-app-card chart-shell p-6">
            <p className="fitai-ref-kicker">Goal Distribution</p>
            <h2 className="fitai-ref-card-title mt-3">Current user goals</h2>
            <div className="mt-6">
              <Bar data={goalsChart} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Top Exercises</p>
            <div className="mt-5 space-y-3">
              {data.topExercises.map((item) => (
                <div key={item.name} className="fitai-ref-list-row">
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="fitai-ref-chip-dark">
                    {item.count} uses
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Recent Public Leads</p>
            <div className="mt-5 space-y-3">
              {data.latestContacts.map((item) => (
                <div key={item._id} className="fitai-ref-app-card-soft p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.email}</p>
                    </div>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
                      {item.interest}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{item.message || 'No message provided.'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Analytics;
