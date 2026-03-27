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
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['Users', data.metrics.totalUsers || 0],
            ['Workouts', data.metrics.totalWorkouts || 0],
            ['Contacts', data.metrics.totalContacts || 0],
            ['Reward Points', data.metrics.rewardPointsIssued || 0],
            ['Avg Duration', `${data.metrics.averageWorkoutDuration || 0} min`],
            ['Progress Logs', data.metrics.latestProgressEntries || 0],
          ].map(([label, value]) => (
            <div key={label} className="glass-card glass-morphism rounded-[2rem] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-card glass-morphism chart-shell rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-cyan-300">Workout Activity</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Workouts across the last 7 days</h2>
            <div className="mt-6">
              <Bar data={workoutsChart} />
            </div>
          </div>

          <div className="glass-card glass-morphism chart-shell rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-fuchsia-300">Goal Distribution</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Current user goals</h2>
            <div className="mt-6">
              <Bar data={goalsChart} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Top Exercises</p>
            <div className="mt-5 space-y-3">
              {data.topExercises.map((item) => (
                <div key={item.name} className="glass-morphism flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {item.count} uses
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-amber-300">Recent Public Leads</p>
            <div className="mt-5 space-y-3">
              {data.latestContacts.map((item) => (
                <div key={item._id} className="feature-panel glass-morphism rounded-2xl p-4">
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
