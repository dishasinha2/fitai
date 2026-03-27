import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PublicHeader from './PublicHeader';
import { saveSession } from '../lib/session';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email: normalizedEmail,
        password: form.password,
      });
      saveSession(response.data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fitai-shell fitai-grid min-h-screen">
      <PublicHeader />
      <div className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hero-gradient hero-3d glass-card glass-morphism rounded-[2rem] p-8 sm:p-10">
          <span className="status-pill">Smart Virtual Trainer</span>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Real-time workouts, AI coaching, diet planning, and streak rewards in one dashboard.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            FitAI guides gym users and home workout users through the full cycle: login, set goals, train, get next
            exercise suggestions, review progress, and stay motivated with rewards.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Workout tracking', 'Log sets, reps, duration, and daily sessions'],
              ['AI trainer', 'Goal-based exercise suggestions for gym and home'],
              ['Progress + rewards', 'Weight charts, streaks, and badges'],
            ].map(([title, copy]) => (
              <div key={title} className="glass-morphism floating-panel rounded-3xl p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card glass-morphism tilt-card rounded-[2rem] p-8 sm:p-10">
          <p className="section-title text-sm font-semibold text-emerald-300">Login</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Resume your FitAI plan</h2>
          <p className="mt-3 text-slate-400">
            Sign in to continue your personalized workflow and see today's recommendations.
          </p>
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Secure login includes stronger password rules and temporary lockout after repeated failed attempts.
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                placeholder="athlete@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 pr-20 text-white outline-none transition focus:border-emerald-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            New to FitAI?{' '}
            <Link to="/signup" className="font-medium text-emerald-300 transition hover:text-emerald-200">
              Create your account
            </Link>
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}

export default Login;
