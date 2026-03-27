import { useEffect, useState } from 'react';
import Layout from './Layout';
import api from '../lib/api';
import { getStoredUser, saveSession } from '../lib/session';

function Settings() {
  const storedUser = getStoredUser();
  const [form, setForm] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    fitnessGoal: 'maintenance',
    activityLevel: 'beginner',
    location: 'gym',
    workoutDaysPerWeek: 3,
    sessionDuration: 45,
    dietaryPreference: 'balanced',
    focusAreas: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const user = storedUser;
    setForm({
      name: user?.name || '',
      age: user?.age ?? '',
      weight: user?.weight ?? '',
      height: user?.height ?? '',
      fitnessGoal: user?.fitnessGoal || 'maintenance',
      activityLevel: user?.activityLevel || 'beginner',
      location: user?.location || 'gym',
      workoutDaysPerWeek: user?.preferences?.workoutDaysPerWeek || 3,
      sessionDuration: user?.preferences?.sessionDuration || 45,
      dietaryPreference: user?.preferences?.dietaryPreference || 'balanced',
      focusAreas: (user?.preferences?.focusAreas || []).join(', '),
    });
  }, [storedUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await api.put('/auth/profile', {
        name: form.name,
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height),
        fitnessGoal: form.fitnessGoal,
        activityLevel: form.activityLevel,
        location: form.location,
        preferences: {
          workoutDaysPerWeek: Number(form.workoutDaysPerWeek),
          sessionDuration: Number(form.sessionDuration),
          dietaryPreference: form.dietaryPreference,
          focusAreas: form.focusAreas
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });

      saveSession({ token: localStorage.getItem('token'), user: response.data });
      setMessage('Settings saved successfully. FitAI will use these preferences across workouts, diet, and recommendations.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title="Settings"
      subtitle="Manage your FitAI identity, workout preferences, and personalization defaults from one dedicated settings page."
    >
      {(message || error) && (
        <div className={`mb-6 rounded-3xl border px-5 py-4 text-sm ${
          error
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
            : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
        }`}>
          {message || error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-card glass-morphism rounded-[2rem] p-6">
          <p className="section-title text-sm font-semibold text-cyan-300">Personalization</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Profile and training settings</h2>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['name', 'Full name', 'text'],
              ['age', 'Age', 'number'],
              ['weight', 'Weight (kg)', 'number'],
              ['height', 'Height (cm)', 'number'],
              ['workoutDaysPerWeek', 'Workout days/week', 'number'],
              ['sessionDuration', 'Session duration (min)', 'number'],
            ].map(([name, label, type]) => (
              <label key={name} className="block">
                <span className="mb-2 block text-sm text-slate-300">{label}</span>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Goal</span>
              <select
                name="fitnessGoal"
                value={form.fitnessGoal}
                onChange={handleChange}
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                <option value="fat_loss">Fat loss</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Activity level</span>
              <select
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Workout location</span>
              <select
                name="location"
                value={form.location}
                onChange={handleChange}
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                <option value="gym">Gym</option>
                <option value="home">Home</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Diet style</span>
              <select
                name="dietaryPreference"
                value={form.dietaryPreference}
                onChange={handleChange}
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                <option value="balanced">Balanced</option>
                <option value="high_protein">High protein</option>
                <option value="vegetarian">Vegetarian</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Focus areas</span>
              <input
                name="focusAreas"
                value={form.focusAreas}
                onChange={handleChange}
                placeholder="strength, fat_loss, mobility, home_routine"
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="cta-primary rounded-full px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Account Snapshot</p>
            <div className="mt-5 space-y-3">
              {[
                ['Email', storedUser?.email || '--'],
                ['Current goal', storedUser?.fitnessGoal?.replace('_', ' ') || '--'],
                ['Location', storedUser?.location || '--'],
                ['Focus areas', (storedUser?.preferences?.focusAreas || []).join(', ') || 'Not set'],
              ].map(([label, value]) => (
                <div key={label} className="glass-morphism rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-medium text-white capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-fuchsia-300">What Settings Affect</p>
            <div className="mt-5 space-y-3">
              {[
                'AI workout recommendations and next-exercise suggestions',
                'Home versus gym exercise filtering',
                'Diet planning defaults and meal guidance',
                'Onboarding priorities and workout template context',
              ].map((item) => (
                <div key={item} className="glass-morphism rounded-2xl px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default Settings;
