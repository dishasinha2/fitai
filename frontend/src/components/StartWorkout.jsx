import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import api from '../lib/api';
import { getStoredUser } from '../lib/session';

function StartWorkout() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [workout, setWorkout] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function bootstrapWorkout() {
      try {
        const [sessionResponse, exercisesResponse] = await Promise.all([
          api.post('/workouts/session/start'),
          api.get('/workouts/exercises'),
        ]);

        setSession(sessionResponse.data);
        setCatalog(exercisesResponse.data);
        setWorkout(
          (sessionResponse.data.recommendation?.exercises || []).map((exercise) => ({
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            duration: exercise.duration,
            weight: 0,
            youtubeId: exercise.youtubeId || '',
          })),
        );
      } catch (_error) {
        setMessage('Unable to load workout session. Please make sure the backend is running.');
      }
    }

    bootstrapWorkout();
  }, []);

  useEffect(() => {
    async function loadGuidance() {
      if (!selectedExerciseId) return;
      const response = await api.get(`/workouts/guidance/${selectedExerciseId}`);
      setGuidance(response.data);
    }

    loadGuidance();
  }, [selectedExerciseId]);

  const nextSuggestion = useMemo(() => {
    const source = session?.recommendation?.exercises || [];
    return source.find((exercise) => !workout.some((logged) => logged.name === exercise.name)) || source[0] || null;
  }, [session, workout]);

  const addExerciseToWorkout = (exercise) => {
    if (workout.some((item) => item.name === exercise.name)) return;

    setWorkout((current) => [
      ...current,
      {
        exerciseId: exercise._id || exercise.exerciseId,
        name: exercise.name,
        sets: exercise.sets || 3,
        reps: exercise.reps || 10,
        duration: exercise.duration || 12,
        weight: 0,
        youtubeId: exercise.youtubeId || '',
      },
    ]);

    setSelectedExerciseId(exercise._id || exercise.exerciseId || '');
  };

  const updateWorkoutEntry = (index, field, value) => {
    setWorkout((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: Number(value) || 0 } : entry,
      ),
    );
  };

  const saveWorkout = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await api.post('/workouts', {
        exercises: workout,
        location: user?.location || 'gym',
        aiSummary: session?.recommendation?.aiSummary || '',
      });

      setMessage(`Workout saved. Current streak: ${response.data.streak} day${response.data.streak === 1 ? '' : 's'}.`);
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to save workout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title="Start Workout Session"
      subtitle="Track exercises, log sets/reps/time, get the next move from FitAI, and keep your guidance video visible while you train."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <section className="space-y-6">
          <div className="hero-gradient glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Session Start</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">AI-built workout session</h2>
            <p className="mt-3 text-slate-300">
              {session?.recommendation?.aiSummary || 'Preparing recommendations based on your goal, location, and recent sessions.'}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Goal', user?.fitnessGoal?.replace('_', ' ') || '--'],
                ['Location', user?.location || '--'],
                ['Preferred duration', `${session?.sessionDefaults?.sessionDuration || user?.preferences?.sessionDuration || 45} min`],
                ['Dynamic next move', nextSuggestion?.name || 'Loading'],
              ].map(([label, value]) => (
                <div key={label} className="glass-morphism rounded-3xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-3 text-lg font-semibold capitalize text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-title text-sm font-semibold text-cyan-300">Recommended Plan</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Suggested exercises for this session</h3>
              </div>
              {nextSuggestion && (
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  Next exercise: <span className="font-semibold">{nextSuggestion.name}</span>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(session?.recommendation?.exercises || []).map((exercise) => (
                <button
                  key={exercise.name}
                  type="button"
                  onClick={() => addExerciseToWorkout(exercise)}
                  className="glass-morphism rounded-3xl p-5 text-left transition hover:border-cyan-400 hover:bg-slate-900/60"
                >
                  <p className="text-lg font-semibold text-white">{exercise.name}</p>
                  <p className="mt-2 text-sm text-slate-400 capitalize">
                    {exercise.category} - {exercise.sets} sets - {exercise.reps} reps - {exercise.duration} min
                  </p>
                  <p className="mt-3 text-sm text-cyan-200">{exercise.reason}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-title text-sm font-semibold text-amber-300">Exercise Library</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Add more exercises</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {catalog.slice(0, 6).map((exercise) => (
                  <button
                    key={exercise._id}
                    type="button"
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300 hover:text-white"
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-rose-300">Workout Tracking</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Live session log</h3>

            <div className="mt-5 space-y-4">
              {workout.length === 0 && <p className="text-sm text-slate-400">Add a recommended exercise to begin tracking.</p>}
              {workout.map((exercise, index) => (
                <div key={`${exercise.name}-${index}`} className="glass-morphism rounded-3xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        className="text-left text-lg font-semibold text-white"
                        onClick={() => setSelectedExerciseId(exercise.exerciseId || '')}
                      >
                        {exercise.name}
                      </button>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Tap name for guidance video
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      ['sets', 'Sets'],
                      ['reps', 'Reps'],
                      ['duration', 'Duration'],
                      ['weight', 'Weight'],
                    ].map(([field, label]) => (
                      <label key={field} className="block">
                        <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
                        <input
                          type="number"
                          min="0"
                          value={exercise[field]}
                          onChange={(event) => updateWorkoutEntry(index, field, event.target.value)}
                          className="input-3d w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-white outline-none transition focus:border-rose-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {message && <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

            <button
              type="button"
              onClick={saveWorkout}
              disabled={!workout.length || saving}
              className="mt-5 w-full rounded-2xl bg-rose-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving workout...' : 'Save Daily Workout Log'}
            </button>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-violet-300">Exercise Guidance</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Correct form video</h3>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/50">
              {guidance?.embedUrl ? (
                <iframe
                  title={guidance.exercise}
                  src={guidance.embedUrl}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="p-5 text-sm text-slate-400">
                  Select an exercise to view guidance. If no seeded video exists, FitAI falls back to YouTube search.
                </div>
              )}
            </div>
            {guidance?.searchUrl && (
              <a
                href={guidance.searchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-violet-400/30 px-4 py-2 text-sm text-violet-200 transition hover:border-violet-300"
              >
                Open YouTube search fallback
              </a>
            )}
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default StartWorkout;
