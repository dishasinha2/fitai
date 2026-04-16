import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PublicHeader from './PublicHeader';
import AppFooter from './AppFooter';
import { saveSession } from '../lib/session';

const initialState = {
  name: '',
  email: '',
  password: '',
  age: 24,
  weight: 68,
  height: 170,
  fitnessGoal: 'maintenance',
  activityLevel: 'beginner',
  location: 'gym',
  preferences: {
    workoutDaysPerWeek: 4,
    sessionDuration: 45,
    dietaryPreference: 'balanced',
  },
};

function Signup() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height),
        preferences: {
          ...form.preferences,
          workoutDaysPerWeek: Number(form.preferences.workoutDaysPerWeek),
          sessionDuration: Number(form.preferences.sessionDuration),
        },
      };
      const response = await api.post('/auth/register', payload);
      saveSession(response.data);
      navigate('/onboarding');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fitai-ref-app-shell fitai-ref-app-grid min-h-screen">
      <PublicHeader />
      <div className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="fitai-ref-auth-card w-full p-8 sm:p-10">
          <div className="max-w-3xl">
            <p className="fitai-ref-kicker">Signup</p>
            <h1 className="fitai-ref-app-title mt-3">Create your FitAI athlete profile</h1>
            <p className="fitai-ref-copy mt-3">
              Set your body metrics, goal, activity level, and workout location so the AI trainer and diet planner can
              personalize everything from day one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              ['name', 'Full name', 'text'],
              ['email', 'Email address', 'email'],
              ['password', 'Password', 'password'],
              ['age', 'Age', 'number'],
              ['weight', 'Weight (kg)', 'number'],
              ['height', 'Height (cm)', 'number'],
            ].map(([name, label, type]) => (
              <label key={name} className="block">
                <span className="mb-2 block text-sm text-slate-300">{label}</span>
                <input
                  name={name}
                  type={type}
                  required={['name', 'email', 'password'].includes(name)}
                  value={form[name]}
                  onChange={handleChange}
                  autoComplete={name === 'password' ? 'new-password' : name}
                  className="fitai-ref-input"
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Fitness goal</span>
              <select
                name="fitnessGoal"
                value={form.fitnessGoal}
                onChange={handleChange}
                className="fitai-ref-input"
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
                className="fitai-ref-input"
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
                className="fitai-ref-input"
              >
                <option value="gym">Gym</option>
                <option value="home">Home workout mode</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Workout days per week</span>
              <input
                name="workoutDaysPerWeek"
                type="number"
                min="1"
                max="7"
                value={form.preferences.workoutDaysPerWeek}
                onChange={handlePreferenceChange}
                className="fitai-ref-input"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Preferred session duration (min)</span>
              <input
                name="sessionDuration"
                type="number"
                min="20"
                max="120"
                value={form.preferences.sessionDuration}
                onChange={handlePreferenceChange}
                className="fitai-ref-input"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-slate-300">Diet style preference</span>
              <select
                name="dietaryPreference"
                value={form.preferences.dietaryPreference}
                onChange={handlePreferenceChange}
                className="fitai-ref-input"
              >
                <option value="balanced">Balanced</option>
                <option value="high_protein">High protein</option>
                <option value="vegetarian">Vegetarian</option>
              </select>
            </label>

            {error ? (
              <div className="md:col-span-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="fitai-ref-action px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create FitAI Account'}
              </button>

              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-rose-300 hover:text-rose-200">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

export default Signup;
