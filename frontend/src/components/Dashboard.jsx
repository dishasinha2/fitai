import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import api from '../lib/api';
import { getStoredUser, saveSession } from '../lib/session';

function Dashboard() {
  const [state, setState] = useState({
    user: getStoredUser(),
    workouts: [],
    rewards: { streak: 0, points: 0, badges: [] },
    progress: { logs: [], summary: {} },
    recommendation: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshingRewards, setRefreshingRewards] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({
    age: '',
    weight: '',
    height: '',
    fitnessGoal: 'maintenance',
    activityLevel: 'beginner',
    location: 'gym',
    workoutDaysPerWeek: 4,
    sessionDuration: 45,
    dietaryPreference: 'balanced',
  });

  const syncProfileForm = (user) => {
    setProfileForm({
      age: user?.age ?? '',
      weight: user?.weight ?? '',
      height: user?.height ?? '',
      fitnessGoal: user?.fitnessGoal || 'maintenance',
      activityLevel: user?.activityLevel || 'beginner',
      location: user?.location || 'gym',
      workoutDaysPerWeek: user?.preferences?.workoutDaysPerWeek || 4,
      sessionDuration: user?.preferences?.sessionDuration || 45,
      dietaryPreference: user?.preferences?.dietaryPreference || 'balanced',
    });
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [userResponse, workoutsResponse, rewardsResponse, progressResponse, recommendationResponse] = await Promise.all([
        api.get('/auth/me'),
        api.get('/workouts'),
        api.get('/rewards'),
        api.get('/progress'),
        api.get('/workouts/recommendations'),
      ]);

      saveSession({ token: localStorage.getItem('token'), user: userResponse.data });
      syncProfileForm(userResponse.data);
      setState({
        user: userResponse.data,
        workouts: workoutsResponse.data,
        rewards: rewardsResponse.data,
        progress: progressResponse.data,
        recommendation: recommendationResponse.data,
      });
    } catch (_error) {
      setError('Unable to load live dashboard data. Start the backend and MongoDB to see the full experience.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = state.progress.summary || {};
  const latestWorkout = state.workouts[0];
  const workflowSteps = [
    'Log in and review your dashboard',
    'Confirm profile, goal, and training location',
    'Start a guided workout session',
    'Track sets, reps, and duration',
    'Get the next exercise from FitAI',
    'Watch correct-form guidance video',
    'Update progress and rewards',
    'Repeat daily to build streaks',
  ];

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setFeedback('');
    setError('');

    try {
      const response = await api.put('/auth/profile', {
        age: Number(profileForm.age),
        weight: Number(profileForm.weight),
        height: Number(profileForm.height),
        fitnessGoal: profileForm.fitnessGoal,
        activityLevel: profileForm.activityLevel,
        location: profileForm.location,
        preferences: {
          workoutDaysPerWeek: Number(profileForm.workoutDaysPerWeek),
          sessionDuration: Number(profileForm.sessionDuration),
          dietaryPreference: profileForm.dietaryPreference,
        },
      });

      saveSession({ token: localStorage.getItem('token'), user: response.data });
      setFeedback('Profile updated. FitAI will use the new goal and preferences in future recommendations.');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRewardRefresh = async () => {
    setRefreshingRewards(true);
    setFeedback('');
    setError('');

    try {
      const response = await api.post('/rewards/refresh');
      setState((current) => ({
        ...current,
        rewards: {
          streak: response.data.streak,
          points: response.data.points,
          badges: response.data.badges,
        },
      }));
      setFeedback('Rewards refreshed from your latest workout history.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to refresh rewards.');
    } finally {
      setRefreshingRewards(false);
    }
  };

  return (
    <Layout
      title={`Welcome back, ${state.user?.name || 'Athlete'}`}
      subtitle="Your FitAI dashboard combines profile-aware workout coaching, streak rewards, diet planning, and progress visibility in one clean flow."
    >
      {(error || feedback) && (
        <div className={`mb-6 rounded-3xl border px-5 py-4 text-sm ${
          error
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
            : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
        }`}>
          {error || feedback}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-6">
          <div className="hero-gradient glass-card glass-morphism rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="status-pill">{state.user?.location === 'home' ? 'Home workout mode' : 'Gym mode active'}</span>
                <h2 className="mt-4 text-3xl font-semibold text-white">Today&apos;s smart training direction</h2>
                <p className="mt-3 max-w-2xl text-slate-300">
                  {state.recommendation?.aiSummary || 'FitAI is preparing your next personalized workout block.'}
                </p>
              </div>

              <Link
                to="/workout"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Start Workout
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Current goal', state.user?.fitnessGoal?.replace('_', ' ') || 'maintenance'],
                ['Streak', `${state.rewards.streak || 0} day${state.rewards.streak === 1 ? '' : 's'}`],
                ['Reward points', `${state.rewards.points || 0} pts`],
                ['Last session', latestWorkout ? `${latestWorkout.totalDuration} min` : 'No sessions yet'],
              ].map(([label, value]) => (
                <div key={label} className="glass-morphism metric-glow rounded-3xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-3 text-xl font-semibold text-white capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card glass-morphism rounded-[2rem] p-6">
              <p className="section-title text-sm font-semibold text-cyan-300">Workflow</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">FitAI training loop</h3>
              <div className="mt-5 space-y-3">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="glass-morphism flex items-start gap-3 rounded-2xl px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card glass-morphism rounded-[2rem] p-6">
              <p className="section-title text-sm font-semibold text-emerald-300">AI Trainer</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Next recommended exercises</h3>
              <div className="mt-5 space-y-3">
                {(state.recommendation?.exercises || []).slice(0, 4).map((exercise) => (
                  <div key={exercise.name} className="glass-morphism rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white">{exercise.name}</p>
                        <p className="mt-1 text-sm text-slate-400 capitalize">
                          {exercise.category} - {exercise.sets} sets - {exercise.reps} reps
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-200">
                        {exercise.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-title text-sm font-semibold text-cyan-300">Profile Controls</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Update goal and preferences</h3>
              </div>
              <button
                type="button"
                onClick={handleRewardRefresh}
                disabled={refreshingRewards}
                className="rounded-2xl border border-cyan-400/30 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshingRewards ? 'Refreshing rewards...' : 'Refresh Rewards'}
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="mt-5 grid gap-4 md:grid-cols-2">
              {[
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
                    value={profileForm[name]}
                    onChange={handleProfileChange}
                    className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Goal</span>
                <select
                  name="fitnessGoal"
                  value={profileForm.fitnessGoal}
                  onChange={handleProfileChange}
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
                  value={profileForm.activityLevel}
                  onChange={handleProfileChange}
                  className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Location</span>
                <select
                  name="location"
                  value={profileForm.location}
                  onChange={handleProfileChange}
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
                  value={profileForm.dietaryPreference}
                  onChange={handleProfileChange}
                  className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="balanced">Balanced</option>
                  <option value="high_protein">High protein</option>
                  <option value="vegetarian">Vegetarian</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Saving profile...' : 'Save Profile Preferences'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-amber-300">Profile Snapshot</p>
            <div className="mt-5 grid gap-3">
              {[
                ['Age', state.user?.age || '--'],
                ['Weight', state.user?.weight ? `${state.user.weight} kg` : '--'],
                ['Height', state.user?.height ? `${state.user.height} cm` : '--'],
                ['Activity level', state.user?.activityLevel || '--'],
                ['Workout days', state.user?.preferences?.workoutDaysPerWeek || '--'],
                ['Session duration', state.user?.preferences?.sessionDuration ? `${state.user.preferences.sessionDuration} min` : '--'],
              ].map(([label, value]) => (
                <div key={label} className="glass-morphism flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium capitalize text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-violet-300">Progress Summary</p>
            <div className="mt-5 grid gap-3">
              {[
                ['Latest weight', summary.latestWeight ? `${summary.latestWeight} kg` : 'Add a log'],
                ['Weight change', `${summary.weightChange || 0} kg`],
                ['Total workouts', summary.totalWorkouts || 0],
                ['Consistency', `${summary.consistencyScore || 0}%`],
                ['Performance volume', summary.totalVolume || 0],
              ].map(([label, value]) => (
                <div key={label} className="glass-morphism rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title text-sm font-semibold text-emerald-300">Badges and Points</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Reward system</h3>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Points</p>
                <p className="mt-1 text-xl font-semibold text-white">{state.rewards.points || 0}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {state.rewards.badges?.length ? (
                state.rewards.badges.slice(0, 4).map((badge) => (
                  <div key={badge._id} className="glass-morphism rounded-2xl p-4">
                    <p className="text-sm font-semibold text-white">{badge.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{badge.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200">{badge.points} pts</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No badges yet. Keep logging workouts to unlock streak rewards.</p>
              )}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-rose-300">Recent Sessions</p>
            <div className="mt-5 space-y-3">
              {loading && <p className="text-sm text-slate-400">Loading dashboard...</p>}
              {!loading && state.workouts.length === 0 && <p className="text-sm text-slate-400">No workouts logged yet. Start your first session.</p>}
              {state.workouts.slice(0, 4).map((workout) => (
                <div key={workout._id} className="glass-morphism rounded-2xl p-4">
                  <p className="text-sm font-semibold text-white">{new Date(workout.date).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {workout.exercises.length} exercises - {workout.totalDuration} min - {workout.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default Dashboard;
