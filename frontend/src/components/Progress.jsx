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
import { Line, Bar } from 'react-chartjs-2';
import Layout from './Layout';
import api from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function Progress() {
  const [data, setData] = useState({ logs: [], summary: {}, workouts: [] });
  const [rewardData, setRewardData] = useState({ streak: 0, points: 0, badges: [] });
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    weight: 68,
    bodyFat: 18,
    chest: 0,
    waist: 0,
    arms: 0,
    notes: '',
  });

  const loadProgress = async () => {
    try {
      const [progressResponse, rewardsResponse, reportResponse] = await Promise.all([
        api.get('/progress'),
        api.get('/rewards'),
        api.get('/progress/report'),
      ]);
      setData(progressResponse.data);
      setRewardData(rewardsResponse.data);
      setReport(reportResponse.data);
    } catch (_error) {
      setData({ logs: [], summary: {}, workouts: [] });
      setRewardData({ streak: 0, points: 0, badges: [] });
      setReport(null);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post('/progress', {
      weight: Number(form.weight),
      bodyFat: Number(form.bodyFat),
      measurements: {
        chest: Number(form.chest),
        waist: Number(form.waist),
        arms: Number(form.arms),
      },
      notes: form.notes,
    });
    setMessage('Progress log saved.');
    await loadProgress();
  };

  const handleCopyReport = async () => {
    if (!report?.shareText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(report.shareText);
      setMessage('Share report copied to clipboard.');
    } catch (_error) {
      setMessage('Unable to copy report right now.');
    }
  };

  const weightChart = {
    labels: data.logs.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Weight (kg)',
        data: data.logs.map((entry) => entry.weight),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.35,
      },
    ],
  };

  const consistencyChart = {
    labels: data.workouts.map((workout) => new Date(workout.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Workout Duration (min)',
        data: data.workouts.map((workout) => workout.totalDuration),
        backgroundColor: 'rgba(56, 189, 248, 0.65)',
        borderRadius: 16,
      },
    ],
  };

  const milestones = [
    {
      label: 'Workout streak',
      value: `${rewardData.streak || 0} day${rewardData.streak === 1 ? '' : 's'}`,
      helper: 'Stay active daily to unlock streak badges.',
    },
    {
      label: 'Reward points',
      value: rewardData.points || 0,
      helper: 'Points increase as rewards and streaks grow.',
    },
    {
      label: 'Progress logs',
      value: data.logs.length,
      helper: 'More logs mean clearer trend lines and milestones.',
    },
  ];

  return (
    <Layout
      title="Progress Tracking"
      subtitle="Monitor weight trends, workout consistency, and performance improvements while updating body measurements after each milestone."
      heroLabel="Performance Review"
      heroImage="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&q=80"
    >
      {message ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Latest weight', data.summary.latestWeight ? `${data.summary.latestWeight} kg` : 'No logs'],
              ['Weight change', `${data.summary.weightChange || 0} kg`],
              ['Consistency score', `${data.summary.consistencyScore || 0}%`],
              ['Total workouts', data.summary.totalWorkouts || 0],
            ].map(([label, value]) => (
              <div key={label} className="fitai-ref-stat-block p-5">
                <p className="fitai-ref-stat-label">{label}</p>
                <p className="fitai-ref-stat-value mt-3">{value}</p>
              </div>
            ))}
          </div>

          <div className="fitai-ref-app-card chart-shell p-6">
            <p className="fitai-ref-kicker">Weight Graph</p>
            <h2 className="fitai-ref-card-title mt-3">Weight change over time</h2>
            <div className="mt-6">
              <Line data={weightChart} />
            </div>
          </div>

          <div className="fitai-ref-app-card chart-shell p-6">
            <p className="fitai-ref-kicker">Workout Consistency</p>
            <h2 className="fitai-ref-card-title mt-3">Session duration trend</h2>
            <div className="mt-6">
              <Bar data={consistencyChart} />
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Milestones</p>
            <h2 className="fitai-ref-card-title mt-3">Progress highlights</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {milestones.map((item) => (
                <div key={item.label} className="fitai-ref-app-card-soft p-5">
                  <p className="fitai-ref-kicker">{item.label}</p>
                  <p className="fitai-ref-card-title mt-3 text-[26px]">{item.value}</p>
                  <p className="fitai-ref-copy mt-2 text-sm">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Performance Insights</p>
            <h2 className="fitai-ref-card-title mt-3">Weekly training summary</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Active days', data.summary.activeDays || 0],
                ['Avg duration', `${data.summary.averageWorkoutDuration || 0} min`],
                ['Best session', `${data.summary.bestWorkoutDuration || 0} min`],
                ['Estimated calories', `${data.summary.totalCalories || 0} kcal`],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-app-card-soft p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="fitai-ref-app-card p-6">
              <p className="fitai-ref-kicker">Personal Records</p>
              <h2 className="fitai-ref-card-title mt-3">Best exercise outputs</h2>
              <div className="mt-5 space-y-3">
                {data.summary.personalRecords?.length ? (
                  data.summary.personalRecords.map((record) => (
                    <div key={`${record.name}-${record.date}`} className="fitai-ref-list-row">
                      <div>
                        <p className="text-sm font-semibold text-white">{record.name}</p>
                        <p className="mt-2 text-sm text-slate-400">
                          {record.weight ? `${record.weight} kg` : `${record.duration} min`} | {record.sets} sets | {record.reps} reps
                        </p>
                      </div>
                      <span className="fitai-ref-chip-dark">{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Save more workouts to surface PRs.</p>
                )}
              </div>
            </div>

            <div className="fitai-ref-app-card p-6">
              <p className="fitai-ref-kicker">Muscle Group Trend</p>
              <h2 className="fitai-ref-card-title mt-3">Recent training balance</h2>
              <div className="mt-5 space-y-3">
                {data.summary.muscleGroupFocus?.length ? (
                  data.summary.muscleGroupFocus.map((item) => (
                    <div key={item.muscleGroup} className="fitai-ref-list-row">
                      <span className="text-sm font-semibold capitalize text-white">{item.muscleGroup.replace('_', ' ')}</span>
                      <span className="fitai-ref-chip-dark">{item.count} hits</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Muscle-group trends will appear after a few logged sessions.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="fitai-ref-app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fitai-ref-kicker">Shareable Report</p>
                <h2 className="fitai-ref-card-title mt-2">Progress snapshot</h2>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="fitai-ref-action-secondary px-4 py-3 text-sm font-medium"
              >
                Copy Report
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              {report?.shareText || 'Your shareable progress summary will appear here after your first data sync.'}
            </p>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Add Progress Log</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {[
                ['weight', 'Weight (kg)'],
                ['bodyFat', 'Body fat %'],
                ['chest', 'Chest (cm)'],
                ['waist', 'Waist (cm)'],
                ['arms', 'Arms (cm)'],
              ].map(([name, label]) => (
                <label key={name} className="block">
                  <span className="mb-2 block text-sm text-slate-300">{label}</span>
                  <input
                    name={name}
                    type="number"
                    value={form[name]}
                    onChange={handleChange}
                    className="fitai-ref-input"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="4"
                  className="fitai-ref-input"
                  placeholder="Energy levels, strength milestones, recovery notes..."
                />
              </label>

              <button
                type="submit"
                className="fitai-ref-action w-full px-4 py-3 font-semibold"
              >
                Save Progress Entry
              </button>
            </form>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Performance Improvement</p>
            <div className="mt-5 space-y-3">
              {data.logs.length === 0 && <p className="text-sm text-slate-400">Your progress history will appear here after the first log.</p>}
              {data.logs.slice().reverse().map((entry) => (
                <div key={entry._id} className="fitai-ref-list-row">
                  <p className="text-sm font-semibold text-white">{new Date(entry.date).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {entry.weight} kg - Body fat {entry.bodyFat || 0}% - Volume {entry.totalVolume || 0}
                  </p>
                  {entry.notes && <p className="mt-2 text-sm text-slate-300">{entry.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default Progress;
