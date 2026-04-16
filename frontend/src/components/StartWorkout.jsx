import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import api from '../lib/api';
import { getStoredUser } from '../lib/session';

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

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

function StartWorkout() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [workout, setWorkout] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [saveSummary, setSaveSummary] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const scoreTone = (score) => {
    if (score >= 90) {
      return 'text-emerald-200 bg-emerald-400/10 border-emerald-300/20';
    }
    if (score >= 75) {
      return 'text-cyan-100 bg-cyan-400/10 border-cyan-300/20';
    }
    return 'text-amber-100 bg-amber-400/10 border-amber-300/20';
  };

  useEffect(() => {
    async function bootstrapWorkout() {
      try {
        const [sessionResponse, exercisesResponse, templatesResponse] = await Promise.all([
          api.post('/workouts/session/start'),
          api.get('/workouts/exercises'),
          api.get('/workouts/templates'),
        ]);

        const recommendedExercises = (sessionResponse.data.recommendation?.exercises || []).map((exercise) => ({
          exerciseId: exercise._id || exercise.exerciseId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          weight: 0,
          youtubeId: exercise.youtubeId || '',
          completed: false,
        }));

        setSession(sessionResponse.data);
        setCatalog(exercisesResponse.data);
        setTemplates(templatesResponse.data);
        setWorkout(recommendedExercises);
        setSelectedExerciseId(recommendedExercises[0]?.exerciseId || '');
      } catch (_error) {
        setMessage('Unable to load workout session. Please make sure the backend is running.');
      }
    }

    bootstrapWorkout();
  }, []);

  useEffect(() => {
    if (!selectedExerciseId) {
      setGuidance(null);
      return;
    }

    async function loadGuidance() {
      try {
        const response = await api.get(`/workouts/guidance/${selectedExerciseId}`);
        setGuidance(response.data);
      } catch (_error) {
        setGuidance(null);
      }
    }

    loadGuidance();
  }, [selectedExerciseId]);

  useEffect(() => {
    if (!sessionRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSessionSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionRunning]);

  useEffect(() => {
    if (!restRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRestRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restRunning]);

  const nextSuggestion = useMemo(() => {
    const source = session?.recommendation?.exercises || [];
    return source.find((exercise) => !workout.some((logged) => logged.name === exercise.name)) || source[0] || null;
  }, [session, workout]);

  const activeExercise = workout.find((item) => String(item.exerciseId) === String(selectedExerciseId)) || workout[0] || null;
  const completedCount = workout.filter((exercise) => exercise.completed).length;
  const progressPercent = workout.length ? Math.round((completedCount / workout.length) * 100) : 0;

  const addExerciseToWorkout = (exercise) => {
    const exerciseId = exercise._id || exercise.exerciseId;
    const existingIndex = workout.findIndex((item) => item.name === exercise.name);
    if (existingIndex >= 0) {
      setSelectedExerciseId(exerciseId || '');
      setExpandedExerciseIndex(existingIndex);
      return;
    }

    setWorkout((current) => {
      const nextWorkout = [
        ...current,
        {
          exerciseId,
          name: exercise.name,
          sets: exercise.sets || 3,
          reps: exercise.reps || 10,
          duration: exercise.duration || 12,
          weight: 0,
          youtubeId: exercise.youtubeId || '',
          completed: false,
        },
      ];
      setExpandedExerciseIndex(nextWorkout.length - 1);
      return nextWorkout;
    });

    setSelectedExerciseId(exerciseId || '');
  };

  const updateWorkoutEntry = (index, field, value) => {
    setWorkout((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: Number(value) || 0 } : entry,
      ),
    );
  };

  const toggleExerciseDone = (index) => {
    setWorkout((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, completed: !entry.completed } : entry,
      ),
    );
  };

  const applyTemplate = (template) => {
    const mappedExercises = (template.exercises || []).map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      sets: Number(exercise.sets || 3),
      reps: Number(exercise.reps || 10),
      duration: Number(exercise.duration || 10),
      weight: Number(exercise.weight || 0),
      youtubeId: exercise.youtubeId || '',
      completed: false,
    }));

    setWorkout(mappedExercises);
    setSelectedExerciseId(mappedExercises[0]?.exerciseId || '');
    setExpandedExerciseIndex(0);
    setMessage(`Template "${template.name}" applied to your live session.`);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setMessage('Enter a template name before saving a routine.');
      return;
    }

    setSavingTemplate(true);
    setMessage('');

    try {
      const response = await api.post('/workouts/templates', {
        name: templateName,
        goal: user?.fitnessGoal || 'maintenance',
        location: user?.location || 'gym',
        exercises: workout,
      });

      setTemplates((current) => [response.data, ...current]);
      setTemplateName('');
      setMessage(`Template "${response.data.name}" saved.`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to save template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      await api.delete(`/workouts/templates/${templateId}`);
      setTemplates((current) => current.filter((item) => item.id !== templateId));
      setMessage('Template removed.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to delete template.');
    }
  };

  const saveWorkout = async () => {
    setSaving(true);
    setMessage('');
    setSaveSummary(null);

    try {
      const response = await api.post('/workouts', {
        exercises: workout,
        location: user?.location || 'gym',
        aiSummary: session?.recommendation?.aiSummary || '',
      });

      setMessage(`Workout saved. Current streak: ${response.data.streak} day${response.data.streak === 1 ? '' : 's'}.`);
      setSaveSummary(response.data);
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to save workout.');
    } finally {
      setSaving(false);
    }
  };

  const startRestTimer = (seconds = 60) => {
    setRestSeconds(seconds);
    setRestRunning(true);
  };

  const startSessionTimer = () => {
    setSessionStarted(true);
    setSessionRunning(true);
  };

  const pauseOrResumeSessionTimer = () => {
    if (!sessionStarted) {
      startSessionTimer();
      return;
    }

    setSessionRunning((current) => !current);
  };

  const resetSessionTimer = () => {
    setSessionStarted(false);
    setSessionRunning(false);
    setSessionSeconds(0);
  };

  const finishWorkout = async () => {
    setSessionRunning(false);
    await saveWorkout();
  };

  return (
    <Layout
      title="Start Workout Session"
      subtitle="Start only when you are ready, follow one clear next step at a time, and keep all workout guidance in one focused place."
      heroLabel="Live Session"
      heroImage="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1600&q=80"
    >
      <div className="fitai-ref-dashboard-shell p-1">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="space-y-6">
            <div className="fitai-ref-dashboard-hero p-6 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="fitai-ref-kicker">Session Overview</p>
                  <h2 className="fitai-ref-app-title mt-3">Train with focus, not clutter</h2>
                  <p className="fitai-ref-copy mt-3 text-base">
                  {session?.recommendation?.aiSummary ||
                      'Preparing a focused session based on your goal, location, and recent training.'}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ['Step 1', 'Press Start Workout when you are ready to begin timing.'],
                      ['Step 2', 'Pick an exercise and log sets, reps, time, and weight clearly.'],
                      ['Step 3', 'Use rest timer and save the session once your workout is done.'],
                    ].map(([label, copy]) => (
                      <div key={label} className="fitai-ref-app-card-soft p-4">
                        <p className="fitai-ref-kicker">{label}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{copy}</p>
                      </div>
                    ))}
                  </div>
                  {session?.recommendation?.recommendationInsights ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="fitai-ref-chip-dark">
                        Goal: {session.recommendation.recommendationInsights.basedOnGoal.replace('_', ' ')}
                      </span>
                      <span className="fitai-ref-chip-dark">
                        Location: {session.recommendation.recommendationInsights.basedOnLocation}
                      </span>
                      <span className="fitai-ref-chip-dark">
                        History: {session.recommendation.recommendationInsights.recentExerciseCount} recent moves
                      </span>
                      <span className="fitai-ref-chip-dark">Progress: {completedCount}/{workout.length || 0} done</span>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
                  Next move: <span className="font-semibold">{nextSuggestion?.name || 'Loading'}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Goal', user?.fitnessGoal?.replace('_', ' ') || '--'],
                  ['Location', user?.location || '--'],
                  ['Session timer', formatSeconds(sessionSeconds)],
                  ['Completion', `${progressPercent}%`],
                ].map(([label, value]) => (
                  <div key={label} className="fitai-ref-stat-block p-4">
                    <p className="fitai-ref-stat-label">{label}</p>
                    <p className="fitai-ref-stat-value mt-3 capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm text-slate-300">
                {sessionStarted
                  ? sessionRunning
                    ? 'Workout timer is running. You can pause it anytime.'
                    : 'Workout timer is paused. Resume whenever you are ready.'
                  : 'Workout timer has not started yet. Press Start Workout to begin tracking your live session.'}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={pauseOrResumeSessionTimer}
                  className="fitai-ref-action px-5 py-3 text-sm font-semibold"
                >
                  {!sessionStarted ? 'Start Workout' : sessionRunning ? 'Pause Workout' : 'Resume Workout'}
                </button>
                <button
                  type="button"
                  onClick={() => startRestTimer(60)}
                  className="fitai-ref-action-secondary px-5 py-3 text-sm font-semibold"
                  disabled={!sessionStarted}
                >
                  Start 60s Rest
                </button>
                <button
                  type="button"
                  onClick={resetSessionTimer}
                  className="fitai-ref-action-secondary px-5 py-3 text-sm font-semibold"
                >
                  Reset Session Timer
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="fitai-ref-app-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="fitai-ref-kicker">Timers</p>
                    <h3 className="fitai-ref-card-title mt-2">Session rhythm</h3>
                  </div>
                  <div className="rounded-full bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100">
                    Rest {formatSeconds(restSeconds)}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="fitai-ref-app-card-soft p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/60">Session timer</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{formatSeconds(sessionSeconds)}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {!sessionStarted ? 'Waiting to start' : sessionRunning ? 'Running now' : 'Paused'}
                    </p>
                  </div>
                  <div className="fitai-ref-app-card-soft p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/60">Rest timer</p>
                    <p className="mt-3 text-4xl font-semibold text-white">{formatSeconds(restSeconds)}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {restRunning ? 'Counting down' : restSeconds > 0 ? 'Paused rest timer' : 'Ready for next set'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {[45, 60, 90].map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => startRestTimer(seconds)}
                      className="fitai-ref-action-secondary px-4 py-2 text-sm"
                      disabled={!sessionStarted}
                    >
                      Start {seconds}s rest
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setRestRunning(false);
                      setRestSeconds(0);
                    }}
                    className="fitai-ref-action-secondary px-4 py-2 text-sm"
                  >
                    Clear rest
                  </button>
                </div>
              </div>

              <div className="fitai-ref-app-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="fitai-ref-kicker">Guidance</p>
                    <h3 className="fitai-ref-card-title mt-2">Current exercise video</h3>
                  </div>
                  {activeExercise ? (
                    <span className="rounded-full bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100">
                      {activeExercise.name}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-emerald-100/10 bg-slate-950/50">
                  {guidance?.embedUrl ? (
                    <iframe
                      title={guidance.exercise}
                      src={guidance.embedUrl}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="p-6 text-sm leading-7 text-slate-400">
                      Select an exercise from your session and FitAI will keep the YouTube form guide here.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {guidance?.youtubeId ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${guidance.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                    >
                      Open Full YouTube Session
                    </a>
                  ) : null}
                  {guidance?.searchUrl ? (
                    <a
                      href={guidance.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="fitai-ref-action-secondary px-4 py-2 text-sm"
                    >
                      Search More Videos
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="fitai-ref-app-card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="fitai-ref-kicker">Recommended Plan</p>
                  <h3 className="fitai-ref-card-title mt-2">Suggested exercises for this session</h3>
                  <p className="mt-2 text-sm text-slate-400">Pick a move, add it to the session, or jump straight to form guidance.</p>
                </div>
                {nextSuggestion ? (
                  <div className="rounded-2xl border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
                    Suggested next: <span className="font-semibold">{nextSuggestion.name}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(session?.recommendation?.exercises || []).map((exercise) => {
                  const confidence = getConfidenceMeta(exercise.mlProbability || 0);

                  return (
                    <div key={exercise.name} className="fitai-ref-app-card-soft p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xl font-semibold text-white">{exercise.name}</p>
                          <p className="mt-2 text-sm capitalize text-slate-400">
                            {exercise.category} | {exercise.sets} sets | {exercise.reps} reps | {exercise.duration} min
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
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
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full bg-rose-300/10 px-3 py-1 text-xs font-medium text-rose-100">
                            Guided
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${scoreTone(exercise.recommendationScore || 0)}`}>
                            Fit Score {exercise.recommendationScore || 0}
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-emerald-50/90">{exercise.reason}</p>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model confidence</p>
                          <p className="text-sm font-medium text-white">{Math.round((exercise.mlProbability || 0) * 100)}%</p>
                        </div>
                        <div className="fitai-confidence-bar mt-2">
                          <div
                            className={`fitai-confidence-fill ${confidence.toneClass}`}
                            style={{ width: `${Math.max(6, Math.round((exercise.mlProbability || 0) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => addExerciseToWorkout(exercise)}
                          className="fitai-ref-action px-4 py-2 text-sm font-semibold"
                        >
                          Add to Session
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseId(exercise._id || exercise.exerciseId || '')}
                          className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                        >
                          Watch Form
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fitai-ref-app-card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="fitai-ref-kicker">Saved Templates</p>
                  <h3 className="fitai-ref-card-title mt-2">Reusable routines</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplates((current) => !current)}
                  className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                >
                  {showTemplates ? 'Hide Templates' : 'Manage Templates'}
                </button>
              </div>

              {showTemplates ? (
                <>
                  <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                    <input
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="Template name"
                      className="fitai-ref-input"
                    />
                    <button
                      type="button"
                      onClick={saveTemplate}
                      disabled={!workout.length || savingTemplate}
                      className="fitai-ref-action px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingTemplate ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {templates.length === 0 ? (
                      <p className="text-sm text-slate-400">No saved templates yet. Save this workout once it feels right.</p>
                    ) : null}
                    {templates.map((template) => (
                      <div key={template.id} className="fitai-ref-app-card-soft p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-white">{template.name}</p>
                            <p className="mt-2 text-sm capitalize text-slate-400">
                              {template.goal?.replace('_', ' ')} | {template.location || 'gym'} | {template.exercises.length} exercises
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => applyTemplate(template)}
                              className="fitai-ref-action-secondary px-3 py-1 text-xs font-semibold"
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTemplate(template.id)}
                              className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:border-rose-300/35"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Open this only when you want to save or reuse a routine.</p>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="fitai-ref-app-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="fitai-ref-kicker">Live Session Log</p>
                  <h3 className="fitai-ref-card-title mt-2">Track each exercise clearly</h3>
                </div>
                  <div className="rounded-full bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100">
                  {workout.length} items
                </div>
              </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm text-slate-300">
                  Complete one exercise at a time. Expand the current block, log your numbers, then mark it done.
                </div>

                <div className="mt-5 space-y-4">
                  {workout.length === 0 ? (
                    <p className="text-sm text-slate-400">Add a recommended exercise to begin tracking.</p>
                  ) : null}

                  {workout.map((exercise, index) => (
                    <div
                      key={`${exercise.name}-${index}`}
                      className={`fitai-ref-app-card-soft p-5 ${exercise.completed ? 'border border-emerald-300/20 bg-emerald-300/10' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <button
                            type="button"
                            className="text-left text-xl font-semibold text-white"
                            onClick={() => {
                              setSelectedExerciseId(exercise.exerciseId || '');
                              setExpandedExerciseIndex(index);
                            }}
                          >
                            {exercise.name}
                          </button>
                          <p className="mt-2 text-sm text-slate-400">
                            {exercise.completed
                              ? 'Marked complete. You can still reopen and edit it.'
                              : 'Update only these four inputs, then mark this exercise done.'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${exercise.completed ? 'bg-emerald-400/15 text-emerald-100' : 'bg-white/5 text-slate-300'}`}>
                            {exercise.completed ? 'Completed' : `Step ${index + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedExerciseIndex(index === expandedExerciseIndex ? -1 : index)}
                            className="fitai-ref-action-secondary px-3 py-1 text-xs font-semibold"
                          >
                            {index === expandedExerciseIndex ? 'Collapse' : 'Open'}
                          </button>
                        </div>
                      </div>

                      {index === expandedExerciseIndex ? (
                        <>
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            {[
                              ['sets', 'Sets'],
                              ['reps', 'Reps'],
                              ['duration', 'Minutes'],
                              ['weight', 'Weight'],
                            ].map(([field, label]) => (
                              <label key={field} className="block">
                                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={exercise[field]}
                                  onChange={(event) => updateWorkoutEntry(index, field, event.target.value)}
                                  className="fitai-ref-input"
                                />
                              </label>
                            ))}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedExerciseId(exercise.exerciseId || '')}
                              className="fitai-ref-action px-4 py-2 text-sm font-semibold"
                            >
                              Show Guidance
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExerciseDone(index)}
                              className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                            >
                              {exercise.completed ? 'Mark as Pending' : 'Mark as Done'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExerciseId(exercise.exerciseId || '');
                                startRestTimer(60);
                              }}
                              className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                              disabled={!sessionStarted}
                            >
                              Watch + Rest
                            </button>
                            {exercise.youtubeId ? (
                              <a
                                href={`https://www.youtube.com/watch?v=${exercise.youtubeId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="fitai-ref-action-secondary px-4 py-2 text-sm"
                              >
                                Open in YouTube
                              </a>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
              </div>

              {message ? (
                <div className="mt-5 rounded-2xl border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
                  {message}
                </div>
              ) : null}

              {saveSummary?.workoutSummary ? (
                <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">Saved Workout Summary</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Total sets', saveSummary.workoutSummary.totalSets],
                      ['Total reps', saveSummary.workoutSummary.totalReps],
                      ['Duration', `${saveSummary.workoutSummary.totalDuration} min`],
                      ['Calories', `${saveSummary.workoutSummary.estimatedCalories} kcal`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  {saveSummary.rewardsAwarded?.length ? (
                    <p className="mt-4 text-sm text-emerald-100">
                      Rewards unlocked: {saveSummary.rewardsAwarded.map((reward) => reward.title).join(', ')}
                    </p>
                  ) : null}
                  {saveSummary.nextRecommendation ? (
                    <p className="mt-2 text-sm text-slate-200">
                      Suggested next session opener: <span className="font-semibold">{saveSummary.nextRecommendation.name}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={saveWorkout}
                  disabled={!workout.length || saving || !sessionStarted}
                  className="fitai-ref-action w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving workout...' : !sessionStarted ? 'Start workout to enable save' : 'Save Daily Workout Log'}
                </button>
                <button
                  type="button"
                  onClick={finishWorkout}
                  disabled={!workout.length || saving || !sessionStarted}
                  className="fitai-ref-action-secondary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Finish Workout
                </button>
              </div>
            </div>

            <div className="fitai-ref-app-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="fitai-ref-kicker">Exercise Library</p>
                  <h3 className="fitai-ref-card-title mt-2">Quick add shortcuts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibrary((current) => !current)}
                  className="fitai-ref-action-secondary px-4 py-2 text-sm font-semibold"
                >
                  {showLibrary ? 'Hide Library' : 'Open Library'}
                </button>
              </div>
              {showLibrary ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {catalog.slice(0, 10).map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="fitai-ref-action-secondary px-4 py-2 text-sm"
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Open the library only if you want to add extra exercises.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

export default StartWorkout;
