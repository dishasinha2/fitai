import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import api from '../lib/api';
import { getStoredUser, saveSession } from '../lib/session';

const getConfidenceMeta = (mlProbability = 0) => {
  if (mlProbability < 0.3) {
    return {
      label: 'Based on limited data',
      toneClass: 'low',
      message: "We're still learning your preferences. Log more workouts for better recommendations!",
    };
  }

  if (mlProbability <= 0.7) {
    return {
      label: 'Moderate confidence',
      toneClass: 'medium',
      message: 'FitAI is picking up patterns from your history. A few more logged sessions will sharpen this recommendation.',
    };
  }

  return {
    label: 'High confidence',
    toneClass: 'high',
    message: 'This recommendation is strongly supported by your training patterns and FitAI model signals.',
  };
};

function ConfidenceTooltip({ message }) {
  return (
    <span className="fitai-confidence-tooltip-group">
      <span className="fitai-confidence-tooltip-trigger" aria-hidden="true">?</span>
      <span className="fitai-confidence-tooltip">{message}</span>
    </span>
  );
}

function Dashboard() {
  const [state, setState] = useState({
    user: getStoredUser(),
    workouts: [],
    rewards: { streak: 0, points: 0, badges: [] },
    progress: { logs: [], summary: {} },
    recommendation: null,
  });
  const [nearbyGyms, setNearbyGyms] = useState({
    loading: false,
    error: '',
    items: [],
    locationLabel: '',
    provider: '',
  });
  const [selectedGym, setSelectedGym] = useState(null);
  const [locatingGyms, setLocatingGyms] = useState(false);
  const [manualGymQuery, setManualGymQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshingRewards, setRefreshingRewards] = useState(false);
  const [coachCheckIn, setCoachCheckIn] = useState(null);
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState(null);
  const [askingCoach, setAskingCoach] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({
    age: '',
    weight: '',
    height: '',
    fitnessGoal: 'maintenance',
    activityLevel: 'beginner',
    location: 'gym',
    gymSearchLocation: '',
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
      gymSearchLocation: user?.preferences?.gymSearchLocation || '',
      workoutDaysPerWeek: user?.preferences?.workoutDaysPerWeek || 4,
      sessionDuration: user?.preferences?.sessionDuration || 45,
      dietaryPreference: user?.preferences?.dietaryPreference || 'balanced',
    });
    setManualGymQuery(user?.preferences?.gymSearchLocation || '');
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [userResponse, workoutsResponse, rewardsResponse, progressResponse, recommendationResponse, coachResponse] = await Promise.all([
        api.get('/auth/me'),
        api.get('/workouts'),
        api.get('/rewards'),
        api.get('/progress'),
        api.get('/workouts/recommendations'),
        api.get('/coach/check-in'),
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
      setCoachCheckIn(coachResponse.data);
      setCoachAnswer(null);
    } catch (_error) {
      setError('Unable to load live dashboard data. Start the backend to see the full experience.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const gymSearchLocation = state.user?.preferences?.gymSearchLocation;

    if (!gymSearchLocation) {
      setNearbyGyms({
        loading: false,
        error: '',
        items: [],
        locationLabel: '',
        provider: '',
      });
      return;
    }

    const loadNearbyGyms = async () => {
      setNearbyGyms((current) => ({ ...current, loading: true, error: '' }));

      try {
        const response = await api.get('/places/nearby-gyms');
        setNearbyGyms({
          loading: false,
          error: '',
          items: response.data.gyms || [],
          locationLabel: response.data.center?.label || response.data.locationQuery || gymSearchLocation,
          provider: response.data.provider || '',
        });
        setSelectedGym(response.data.gyms?.[0] || null);
      } catch (requestError) {
        setNearbyGyms({
          loading: false,
          error: requestError.response?.data?.error || 'Unable to load nearby gyms.',
          items: [],
          locationLabel: gymSearchLocation,
          provider: '',
        });
        setSelectedGym(null);
      }
    };

    loadNearbyGyms();
  }, [state.user?.preferences?.gymSearchLocation]);

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
          gymSearchLocation: profileForm.gymSearchLocation,
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

  const submitRecommendationFeedback = async (exercise, feedbackValue) => {
    setFeedbackSubmitting(`${exercise.name}-${feedbackValue}`);
    setFeedback('');
    setError('');

    try {
      await api.post('/recommendation-feedback', {
        exerciseName: exercise.name,
        feedbackValue,
        sourceScreen: 'dashboard',
        context: {
          goal: state.user?.fitnessGoal,
          location: state.user?.location,
          recommendationSource: state.recommendation?.recommendationSource?.type || 'rule-based',
        },
      });
      setFeedback(`Thanks. Your feedback for ${exercise.name} was saved for future recommendation training.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save recommendation feedback.');
    } finally {
      setFeedbackSubmitting('');
    }
  };

  const askCoach = async (question) => {
    if (!question.trim()) {
      return;
    }

    setAskingCoach(true);
    try {
      const response = await api.post('/coach/ask', { question });
      setCoachAnswer(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'FitAI Coach could not answer right now.');
    } finally {
      setAskingCoach(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setNearbyGyms((current) => ({
        ...current,
        error: 'Your browser does not support GPS location lookup.',
      }));
      return;
    }

    setLocatingGyms(true);
    setNearbyGyms((current) => ({
      ...current,
      error: '',
      loading: true,
    }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.get('/places/nearby-gyms', {
            params: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              label: 'Current location',
            },
          });

          setNearbyGyms({
            loading: false,
            error: '',
            items: response.data.gyms || [],
            locationLabel: response.data.center?.label || 'Current location',
            provider: response.data.provider || '',
          });
          setSelectedGym(response.data.gyms?.[0] || null);
        } catch (requestError) {
          setNearbyGyms({
            loading: false,
            error: requestError.response?.data?.error || 'Unable to load gyms from your current location.',
            items: [],
            locationLabel: 'Current location',
            provider: '',
          });
          setSelectedGym(null);
        } finally {
          setLocatingGyms(false);
        }
      },
      (geoError) => {
        setNearbyGyms((current) => ({
          ...current,
          loading: false,
          error: geoError.message || 'Location access was denied.',
        }));
        setLocatingGyms(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleManualGymSearch = async (event) => {
    event.preventDefault();

    if (!manualGymQuery.trim()) {
      setNearbyGyms((current) => ({
        ...current,
        error: 'Enter a city, area, or locality first.',
      }));
      return;
    }

    setNearbyGyms((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const response = await api.get('/places/nearby-gyms', {
        params: {
          q: manualGymQuery.trim(),
        },
      });

      setNearbyGyms({
        loading: false,
        error: '',
        items: response.data.gyms || [],
        locationLabel: response.data.center?.label || manualGymQuery.trim(),
        provider: response.data.provider || '',
      });
      setSelectedGym(response.data.gyms?.[0] || null);
      setLocationSuggestions([]);
    } catch (requestError) {
      setNearbyGyms({
        loading: false,
        error: requestError.response?.data?.error || 'Unable to search gyms for this area.',
        items: [],
        locationLabel: manualGymQuery.trim(),
        provider: '',
      });
      setSelectedGym(null);
    }
  };

  useEffect(() => {
    const trimmedQuery = manualGymQuery.trim();

    if (trimmedQuery.length < 2) {
      setLocationSuggestions([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await api.get('/places/autocomplete', {
          params: {
            q: trimmedQuery,
          },
        });
        setLocationSuggestions(response.data.suggestions || []);
      } catch (_error) {
        setLocationSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [manualGymQuery]);

  return (
    <Layout
      title={`Welcome back, ${state.user?.name || 'Athlete'}`}
      subtitle="Your FitAI dashboard combines profile-aware workout coaching, streak rewards, diet planning, and progress visibility in one clean flow."
      heroLabel="Daily Command Center"
      heroImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80"
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
          <div className="fitai-ref-dashboard-hero p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="fitai-ref-pill">{state.user?.location === 'home' ? 'Home workout mode' : 'Gym mode active'}</span>
                <h2 className="fitai-ref-app-title mt-4">Today&apos;s smart training direction</h2>
                <p className="fitai-ref-copy mt-3 max-w-2xl">
                  {state.recommendation?.aiSummary || 'FitAI is preparing your next personalized workout block.'}
                </p>
              </div>

              <Link
                to="/workout"
                className="fitai-ref-action inline-flex items-center justify-center px-5 py-3 font-semibold"
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
                <div key={label} className="fitai-ref-stat-block p-4">
                  <p className="fitai-ref-stat-label">{label}</p>
                  <p className="fitai-ref-stat-value mt-3 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="fitai-ref-app-card p-6">
              <p className="fitai-ref-kicker">Workflow</p>
              <h3 className="fitai-ref-card-title mt-3">FitAI training loop</h3>
              <div className="mt-5 space-y-3">
                {workflowSteps.map((step, index) => (
                  <div key={step} className={`fitai-ref-list-row ${index === 2 ? 'active' : ''}`}>
                    <div className="fitai-ref-chip-dark">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="fitai-ref-app-card p-6">
              <p className="fitai-ref-kicker">AI Trainer</p>
              <h3 className="fitai-ref-card-title mt-3">Next recommended exercises</h3>
              <div className="mt-5 space-y-4">
                {(state.recommendation?.exercises || []).slice(0, 4).map((exercise) => (
                  <div key={exercise.name} className="fitai-ref-list-row">
                    {(() => {
                      const confidence = getConfidenceMeta(exercise.mlProbability || 0);
                      return (
                        <>
                    <div className="w-full flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-white">{exercise.name}</p>
                        <p className="mt-1 text-sm text-slate-400 capitalize">
                          {exercise.category} - {exercise.sets} sets - {exercise.reps} reps
                        </p>
                      </div>
                      <span className="fitai-ref-chip-dark whitespace-nowrap">
                        {exercise.equipment || 'no equipment'}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex flex-wrap gap-2">
                        <span className="fitai-ref-chip-dark">
                          Fit score {Math.round(exercise.recommendationScore || 0)}
                        </span>
                        <span className="fitai-ref-chip-dark">
                          ML {Math.round((exercise.mlProbability || 0) * 100)}%
                        </span>
                        <span className={`fitai-confidence-chip ${confidence.toneClass}`}>
                          {confidence.label}
                          <ConfidenceTooltip message={confidence.message} />
                        </span>
                        {(exercise.categoryProbability || 0) > 0 ? (
                          <span className="fitai-ref-chip-dark">
                            Category {Math.round((exercise.categoryProbability || 0) * 100)}%
                          </span>
                        ) : null}
                        {(exercise.fitScoreBreakdown?.recentSuccessScore || 0) > 0 ? (
                          <span className="fitai-ref-chip-dark">
                            Recent success +{Math.round(exercise.fitScoreBreakdown?.recentSuccessScore || 0)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model confidence</p>
                        <p className="text-sm font-medium text-white">{Math.round((exercise.mlProbability || 0) * 100)}%</p>
                      </div>
                      <div className="fitai-confidence-bar mt-2">
                        <div
                          className={`fitai-confidence-fill ${confidence.toneClass}`}
                          style={{ width: `${Math.max(8, Math.round((exercise.mlProbability || 0) * 100))}%` }}
                        />
                      </div>
                    </div>
                    <p className="w-full text-sm leading-6 text-slate-300">{exercise.reason}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => submitRecommendationFeedback(exercise, 1)}
                        disabled={feedbackSubmitting === `${exercise.name}-1`}
                        className="fitai-ref-action-secondary px-3 py-2 text-xs font-medium"
                      >
                        {feedbackSubmitting === `${exercise.name}-1` ? 'Saving...' : 'Helpful'}
                      </button>
                      <button
                        type="button"
                        onClick={() => submitRecommendationFeedback(exercise, -1)}
                        disabled={feedbackSubmitting === `${exercise.name}--1`}
                        className="fitai-ref-action-secondary px-3 py-2 text-xs font-medium"
                      >
                        {feedbackSubmitting === `${exercise.name}--1` ? 'Saving...' : 'Not relevant'}
                      </button>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="fitai-ref-kicker">FitAI Coach</p>
                <h3 className="fitai-ref-card-title mt-2">Daily check-in and guidance</h3>
                <p className="mt-3 text-sm text-slate-400">
                  Ask for workout, recovery, nutrition, or progress advice based on your actual FitAI data.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['What should I focus on today?', 'How can I improve recovery?', 'How is my diet doing?'].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setCoachQuestion(prompt);
                      askCoach(prompt);
                    }}
                    className="fitai-ref-action-secondary px-4 py-2 text-xs font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {coachCheckIn ? (
              <div className="mt-5 rounded-3xl border border-rose-300/15 bg-rose-400/8 p-5">
                <p className="text-lg font-semibold text-white">{coachCheckIn.headline}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{coachCheckIn.summary}</p>
                <p className="mt-3 text-sm text-rose-100">{coachCheckIn.motivation}</p>
                {coachCheckIn.source ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Source: {coachCheckIn.source}</p>
                ) : null}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {coachCheckIn.actions?.map((action) => (
                    <div key={action} className="fitai-ref-app-card-soft p-4">
                      <p className="text-sm text-slate-200">{action}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-400">Recovery cue: {coachCheckIn.recoveryNote}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={coachQuestion}
                onChange={(event) => setCoachQuestion(event.target.value)}
                placeholder="Ask FitAI Coach anything about training, diet, or recovery"
                className="fitai-ref-input"
              />
              <button
                type="button"
                onClick={() => askCoach(coachQuestion)}
                disabled={askingCoach}
                className="fitai-ref-action px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {askingCoach ? 'Thinking...' : 'Ask Coach'}
              </button>
            </div>

            {coachAnswer ? (
              <div className="mt-5 rounded-3xl border border-cyan-300/15 bg-cyan-400/8 p-5">
                <p className="text-lg font-semibold text-white">Coach answer</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{coachAnswer.reply}</p>
                {coachAnswer.source ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Source: {coachAnswer.source}</p>
                ) : null}
                {coachAnswer.actionItems?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {coachAnswer.actionItems.map((item) => (
                      <span key={item} className="fitai-ref-chip-dark">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="fitai-ref-kicker">Profile Controls</p>
                <h3 className="fitai-ref-card-title mt-2">Update goal and preferences</h3>
              </div>
              <button
                type="button"
                onClick={handleRewardRefresh}
                disabled={refreshingRewards}
                className="fitai-ref-action-secondary px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="fitai-ref-input"
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Goal</span>
                <select
                  name="fitnessGoal"
                  value={profileForm.fitnessGoal}
                  onChange={handleProfileChange}
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
                  value={profileForm.activityLevel}
                  onChange={handleProfileChange}
                  className="fitai-ref-input"
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
                  className="fitai-ref-input"
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
                  className="fitai-ref-input"
                >
                  <option value="balanced">Balanced</option>
                  <option value="high_protein">High protein</option>
                  <option value="vegetarian">Vegetarian</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">City or area for nearby gym search</span>
                <input
                  name="gymSearchLocation"
                  value={profileForm.gymSearchLocation}
                  onChange={handleProfileChange}
                  placeholder="Delhi, Saket or your local area"
                  className="fitai-ref-input"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="fitai-ref-action px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Saving profile...' : 'Save Profile Preferences'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Profile Snapshot</p>
            <div className="mt-5 grid gap-3">
              {[
                ['Age', state.user?.age || '--'],
                ['Weight', state.user?.weight ? `${state.user.weight} kg` : '--'],
                ['Height', state.user?.height ? `${state.user.height} cm` : '--'],
                ['Activity level', state.user?.activityLevel || '--'],
                ['Workout days', state.user?.preferences?.workoutDaysPerWeek || '--'],
                ['Gym search area', state.user?.preferences?.gymSearchLocation || '--'],
                ['Session duration', state.user?.preferences?.sessionDuration ? `${state.user.preferences.sessionDuration} min` : '--'],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-list-row-simple">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium capitalize text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Progress Summary</p>
            <div className="mt-5 grid gap-3">
              {[
                ['Latest weight', summary.latestWeight ? `${summary.latestWeight} kg` : 'Add a log'],
                ['Weight change', `${summary.weightChange || 0} kg`],
                ['Total workouts', summary.totalWorkouts || 0],
                ['Consistency', `${summary.consistencyScore || 0}%`],
                ['Performance volume', summary.totalVolume || 0],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-list-row-simple">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fitai-ref-kicker">Badges and Points</p>
                <h3 className="fitai-ref-card-title mt-2">Reward system</h3>
              </div>
              <div className="fitai-ref-profile-box text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Points</p>
                <p className="mt-1 text-xl font-semibold text-white">{state.rewards.points || 0}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {state.rewards.badges?.length ? (
                state.rewards.badges.slice(0, 4).map((badge) => (
                  <div key={badge._id} className="fitai-ref-list-row">
                    <p className="text-sm font-semibold text-white">{badge.title}</p>
                    <p className="text-sm text-slate-400">{badge.description}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">{badge.points} pts</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No badges yet. Keep logging workouts to unlock streak rewards.</p>
              )}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Recent Sessions</p>
            <div className="mt-5 space-y-3">
              {loading && <p className="text-sm text-slate-400">Loading dashboard...</p>}
              {!loading && state.workouts.length === 0 && <p className="text-sm text-slate-400">No workouts logged yet. Start your first session.</p>}
              {state.workouts.slice(0, 4).map((workout) => (
                <div key={workout._id} className="fitai-ref-list-row">
                  <p className="text-sm font-semibold text-white">{new Date(workout.date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-400">
                    {workout.exercises.length} exercises - {workout.totalDuration} min - {workout.location}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fitai-ref-kicker">Nearby Gyms</p>
                <h3 className="fitai-ref-card-title mt-2">Find gyms near your area</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Search faster, compare closer options, and open the best match directly on map.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locatingGyms}
                  className="fitai-ref-action-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]"
                >
                  {locatingGyms ? 'Locating...' : 'Use Current GPS'}
                </button>
                <Link
                  to="/settings"
                  className="fitai-ref-action-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]"
                >
                  Edit area
                </Link>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <form onSubmit={handleManualGymSearch} className="fitai-ref-app-card-soft gym-search-shell p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Manual Search</p>
                    <p className="mt-2 text-sm text-slate-300">Try city, sector, locality, or your exact area.</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Nearby match finder
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={manualGymQuery}
                    onChange={(event) => setManualGymQuery(event.target.value)}
                    placeholder="Enter area manually, like Noida Sector 18"
                    className="fitai-ref-input gym-search-input"
                  />
                  <button
                    type="submit"
                    className="fitai-ref-action gym-search-button px-5 py-3 text-sm font-semibold"
                  >
                    Search
                  </button>
                </div>
                {loadingSuggestions ? <p className="mt-3 text-xs text-slate-400">Loading suggestions...</p> : null}
                {locationSuggestions.length ? (
                  <div className="mt-3 grid gap-2">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => {
                          setManualGymQuery(suggestion.label);
                          setLocationSuggestions([]);
                        }}
                        className="fitai-ref-action-secondary w-full px-3 py-3 text-left text-sm text-slate-200"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>

              {!state.user?.preferences?.gymSearchLocation ? (
                <div className="fitai-ref-app-card-soft p-4 text-sm text-slate-300">
                  Add your city or locality in profile settings to see nearby gym suggestions here.
                </div>
              ) : null}

              {nearbyGyms.locationLabel ? (
                <div className="fitai-ref-app-card-soft gym-location-shell px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Search area</p>
                      <p className="mt-2 text-sm leading-6 text-white">{nearbyGyms.locationLabel}</p>
                    </div>
                    {nearbyGyms.provider ? (
                      <span className="rounded-full bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                        {nearbyGyms.provider.replace('_', ' ')}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {nearbyGyms.loading ? <p className="text-sm text-slate-400">Finding nearby gyms...</p> : null}
              {nearbyGyms.error ? <p className="text-sm text-rose-200">{nearbyGyms.error}</p> : null}
              {!nearbyGyms.loading && !nearbyGyms.error && nearbyGyms.items.length === 0 && nearbyGyms.locationLabel ? (
                <div className="fitai-ref-app-card-soft p-4 text-sm text-slate-300">
                  Is area ke paas direct gym data nahi mila. Use current GPS try karo ya search area ko thoda broader
                  rakho, jaise city ya nearby locality.
                </div>
              ) : null}

              {selectedGym ? (
                <div className="gym-visual-card rounded-3xl p-5">
                  <div className="gym-cover rounded-[1.75rem] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">Selected Gym</p>
                        <p className="mt-2 text-xl font-semibold text-white">{selectedGym.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-100">
                          FitAI score {selectedGym.fitaiScore}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-amber-300">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index}>
                          {index < Math.max(3, Math.round(selectedGym.rating || selectedGym.fitaiScore / 20)) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    {selectedGym.rating ? (
                      <p className="mt-2 text-sm text-slate-200">
                        {selectedGym.rating.toFixed(1)} rating
                        {selectedGym.userRatingCount ? ` | ${selectedGym.userRatingCount} reviews` : ''}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-200">Estimated using FitAI rank and distance intelligence</p>
                    )}
                    <p className="mt-4 text-sm leading-6 text-slate-100/90">{selectedGym.address}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        {selectedGym.distanceKm} km away
                      </span>
                      <a
                        href={selectedGym.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-cyan-400/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100"
                      >
                        Open full map
                      </a>
                    </div>
                  </div>

                  {selectedGym.mapEmbedUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-700 bg-slate-950/50">
                      <iframe
                        title={`${selectedGym.name} map`}
                        src={selectedGym.mapEmbedUrl}
                        className="h-56 w-full"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {nearbyGyms.items.map((gym) => (
                <button
                  key={gym.id}
                  type="button"
                  onClick={() => setSelectedGym(gym)}
                  className={`w-full rounded-[1.4rem] p-4 text-left transition ${
                    selectedGym?.id === gym.id
                      ? 'border border-rose-300/30 bg-rose-400/10 shadow-[0_16px_34px_rgba(232,52,26,0.12)]'
                      : 'fitai-ref-app-card-soft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{gym.name}</p>
                        {selectedGym?.id === gym.id ? (
                          <span className="rounded-full bg-rose-400/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-100">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{gym.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        {gym.distanceKm} km
                      </span>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-200">FitAI score {gym.fitaiScore}</p>
                      {gym.rating ? (
                        <p className="mt-2 text-xs text-slate-300">
                          {gym.rating.toFixed(1)} stars{gym.userRatingCount ? ` | ${gym.userRatingCount}` : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default Dashboard;
