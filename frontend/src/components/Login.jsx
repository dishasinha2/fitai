import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PublicHeader from './PublicHeader';
import AppFooter from './AppFooter';
import { saveSession } from '../lib/session';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
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
    <div className="fitai-ref-app-shell fitai-ref-app-grid min-h-screen">
      <PublicHeader />
      <div className="flex min-h-[calc(100vh-92px)] w-full items-stretch justify-center px-4 py-0 sm:px-6 lg:px-8">
        <div className="fitai-ref-auth-shell w-full lg:grid-cols-[1.2fr_0.8fr] lg:grid">
          <section className="fitai-ref-auth-hero p-8 sm:p-10">
            <span className="fitai-ref-pill">Smart Virtual Trainer</span>
            <h1 className="fitai-ref-title mt-6 max-w-xl">
              Real-time workouts, AI coaching, diet planning, and streak rewards in one dashboard.
            </h1>
            <p className="fitai-ref-copy mt-5 max-w-2xl text-base sm:text-lg">
              FitAI guides gym users and home workout users through the full cycle: login, set goals, train, get next
              exercise suggestions, review progress, and stay motivated with rewards.
            </p>

            <div className="fitai-ref-mini-grid mt-8">
              {[
                ['Workout tracking', 'Log sets, reps, duration, and daily sessions'],
                ['AI trainer', 'Goal-based exercise suggestions for gym and home'],
                ['Progress + rewards', 'Weight charts, streaks, and badges'],
              ].map(([title, copy]) => (
                <div key={title} className="fitai-ref-app-card-soft p-4">
                  <p className="fitai-ref-kicker">{title}</p>
                  <p className="fitai-ref-copy mt-3 text-sm">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="fitai-ref-auth-card p-8 sm:p-10">
            <p className="fitai-ref-kicker">Login</p>
            <h2 className="fitai-ref-card-title mt-3">Resume your FitAI plan</h2>
            <p className="fitai-ref-copy mt-3">
              Sign in to continue your personalized workflow and see today's recommendations.
            </p>
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              Secure login includes token validation, account lockout after repeated failures, and extra device-level throttling.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['12h secure session', 'Account lockout', 'Device throttling'].map((item) => (
                <span key={item} className="fitai-ref-chip-dark">{item}</span>
              ))}
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
                  autoComplete="username"
                  className="fitai-ref-input"
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
                    onKeyUp={(event) => setCapsLockOn(event.getModifierState('CapsLock'))}
                    onKeyDown={(event) => setCapsLockOn(event.getModifierState('CapsLock'))}
                    autoComplete="current-password"
                    className="fitai-ref-input pr-20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="fitai-ref-action-secondary absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {capsLockOn ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Caps Lock is on. Make sure your password case is correct.
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="fitai-ref-action w-full px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login to Dashboard'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              New to FitAI?{' '}
              <Link to="/signup" className="font-medium text-rose-300 transition hover:text-rose-200">
                Create your account
              </Link>
            </p>
          </section>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

export default Login;
