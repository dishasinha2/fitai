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
      const response = await api.get('/progress');
      setData(response.data);
    } catch (_error) {
      setData({ logs: [], summary: {}, workouts: [] });
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
    await loadProgress();
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

  return (
    <Layout
      title="Progress Tracking"
      subtitle="Monitor weight trends, workout consistency, and performance improvements while updating body measurements after each milestone."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Latest weight', data.summary.latestWeight ? `${data.summary.latestWeight} kg` : 'No logs'],
              ['Weight change', `${data.summary.weightChange || 0} kg`],
              ['Consistency score', `${data.summary.consistencyScore || 0}%`],
              ['Total workouts', data.summary.totalWorkouts || 0],
            ].map(([label, value]) => (
              <div key={label} className="glass-card glass-morphism rounded-[2rem] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card glass-morphism chart-shell rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Weight Graph</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Weight change over time</h2>
            <div className="mt-6">
              <Line data={weightChart} />
            </div>
          </div>

          <div className="glass-card glass-morphism chart-shell rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-cyan-300">Workout Consistency</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Session duration trend</h2>
            <div className="mt-6">
              <Bar data={consistencyChart} />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-amber-300">Add Progress Log</p>
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
                    className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
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
                  className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                  placeholder="Energy levels, strength milestones, recovery notes..."
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Save Progress Entry
              </button>
            </form>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-violet-300">Performance Improvement</p>
            <div className="mt-5 space-y-3">
              {data.logs.length === 0 && <p className="text-sm text-slate-400">Your progress history will appear here after the first log.</p>}
              {data.logs.slice().reverse().map((entry) => (
                <div key={entry._id} className="glass-morphism rounded-2xl p-4">
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
