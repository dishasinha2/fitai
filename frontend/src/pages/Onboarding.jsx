import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCheckCircle, FaDumbbell, FaHome, FaLeaf, FaBolt } from 'react-icons/fa';
import Layout from '../components/Layout';
import api from '../lib/api';
import { getStoredUser, saveSession } from '../lib/session';

const focusOptions = [
  { value: 'strength', label: 'Strength', icon: FaDumbbell },
  { value: 'fat_loss', label: 'Fat Loss', icon: FaBolt },
  { value: 'mobility', label: 'Mobility', icon: FaLeaf },
  { value: 'home_routine', label: 'Home Routine', icon: FaHome },
];

function Onboarding() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [selectedFocus, setSelectedFocus] = useState(user?.preferences?.focusAreas || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const summaryCards = useMemo(
    () => [
      ['Goal', user?.fitnessGoal?.replace('_', ' ') || 'maintenance'],
      ['Location', user?.location || 'gym'],
      ['Activity Level', user?.activityLevel || 'beginner'],
      ['Session Duration', `${user?.preferences?.sessionDuration || 45} min`],
    ],
    [user],
  );

  const toggleFocus = (value) => {
    setSelectedFocus((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const handleContinue = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await api.put('/auth/profile', {
        preferences: {
          ...user?.preferences,
          focusAreas: selectedFocus,
        },
      });

      saveSession({ token: localStorage.getItem('token'), user: response.data });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save onboarding choices.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title="Finish Setup"
      subtitle="Take one quick step to personalize your coach voice, focus areas, and training direction before entering the dashboard."
      heroLabel="Personalize FitAI"
      heroImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-card glass-morphism rounded-[2rem] p-6 sm:p-8">
          <p className="section-title text-sm font-semibold text-fuchsia-300">Onboarding</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Choose what FitAI should prioritize first</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            These selections help the trainer decide what to emphasize in your early recommendations and home or gym routines.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {focusOptions.map((option) => {
              const Icon = option.icon;
              const selected = selectedFocus.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleFocus(option.value)}
                  className={`glass-morphism rounded-3xl p-5 text-left transition ${
                    selected ? 'border-fuchsia-400/60 bg-fuchsia-500/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-600">
                        <Icon className="text-lg text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{option.label}</p>
                        <p className="text-sm text-slate-400">Use this as a high-priority signal in recommendations.</p>
                      </div>
                    </div>
                    {selected && <FaCheckCircle className="mt-1 text-fuchsia-300" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving setup...' : 'Continue to Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="glass-morphism rounded-full px-6 py-3 font-semibold text-slate-100"
            >
              Skip for now
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="hero-gradient glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-cyan-300">Profile Snapshot</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Your starting setup</h3>
            <div className="mt-5 grid gap-3">
              {summaryCards.map(([label, value]) => (
                <div key={label} className="glass-morphism flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium capitalize text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">What Happens Next</p>
            <div className="mt-5 space-y-3">
              {[
                'FitAI updates your recommendation priorities',
                'The dashboard uses your focus areas in suggested workouts',
                'Home or gym routines stay aligned with your current goal',
                'You can still change these settings later from the dashboard',
              ].map((item) => (
                <div key={item} className="glass-morphism flex items-start gap-3 rounded-2xl px-4 py-3">
                  <FaArrowRight className="mt-1 text-sm text-emerald-300" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default Onboarding;
