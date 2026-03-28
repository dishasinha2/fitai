import { useEffect, useState } from 'react';
import Layout from './Layout';
import api from '../lib/api';

function Diet() {
  const [diet, setDiet] = useState(null);
  const [history, setHistory] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [groceryProgress, setGroceryProgress] = useState(0);
  const [adherence, setAdherence] = useState({
    completionRate: 0,
    weeklyCompletionRate: 0,
    completedToday: [],
    plan: null,
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const activePlanId = adherence.plan?.id || diet?.id || null;

  const fetchDiet = async () => {
    setLoading(true);
    try {
      const [dietResponse, historyResponse, groceryResponse, adherenceResponse] = await Promise.all([
        api.get('/diet'),
        api.get('/diet/history'),
        api.get('/diet/grocery-list'),
        api.get('/diet/adherence'),
      ]);

      setDiet(dietResponse.data);
      setHistory(historyResponse.data || []);
      setGroceryList(groceryResponse.data.items || []);
      setGroceryProgress(groceryResponse.data.completionRate || 0);
      setAdherence(
        adherenceResponse.data || {
          completionRate: 0,
          weeklyCompletionRate: 0,
          completedToday: [],
          plan: null,
          entries: [],
        },
      );
    } catch (_error) {
      setDiet(null);
      setHistory([]);
      setGroceryList([]);
      setGroceryProgress(0);
      setAdherence({ completionRate: 0, weeklyCompletionRate: 0, completedToday: [], plan: null, entries: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet();
  }, []);

  const generateDiet = async () => {
    setMessage('');
    try {
      const response = await api.post('/diet/generate');
      setDiet(response.data);
      setMessage('New diet plan generated and added to your history.');
      await fetchDiet();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to generate a diet plan right now.');
    }
  };

  const markMealComplete = async (mealName) => {
    const targetPlanId = adherence.plan?.id || diet?.id;
    if (!targetPlanId) {
      return;
    }

    try {
      await api.post('/diet/adherence', {
        dietPlanId: targetPlanId,
        mealName,
      });
      setMessage(`${mealName} marked complete for today.`);
      await fetchDiet();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to update meal adherence.');
    }
  };

  const toggleGroceryItem = async (itemName) => {
    if (!activePlanId) {
      return;
    }

    const currentItem = groceryList.find((item) => item.name === itemName);
    const nextChecked = !currentItem?.checked;

    try {
      await api.post('/diet/grocery-list/toggle', {
        dietPlanId: activePlanId,
        itemName,
        checked: nextChecked,
      });
      const nextItems = groceryList.map((item) =>
        item.name === itemName ? { ...item, checked: nextChecked } : item,
      );
      setGroceryList(nextItems);
      const checkedCount = nextItems.filter((item) => item.checked).length;
      setGroceryProgress(nextItems.length ? Math.round((checkedCount / nextItems.length) * 100) : 0);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to update grocery checklist.');
    }
  };

  const selectedPlanIsLatest = !diet || diet.id === adherence.plan?.id || diet.id === history[0]?.id;

  return (
    <Layout
      title="Diet Planner"
      subtitle="Generate a BMI-aware meal plan, track daily adherence, build a grocery checklist, and keep nutrition aligned with your training."
      heroLabel="Nutrition Engine"
      heroImage="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-6">
          <div className="fitai-ref-dashboard-hero p-6">
            <p className="fitai-ref-kicker">Nutrition Engine</p>
            <h2 className="fitai-ref-app-title mt-3">Structured meal planning</h2>
            <p className="fitai-ref-copy mt-3">
              FitAI uses your BMI, goal, activity level, and current routine to create a practical daily plan with
              calories, macros, meals, hydration, and recovery notes.
            </p>
            <button
              type="button"
              onClick={generateDiet}
              className="fitai-ref-action mt-6 px-5 py-3 font-semibold"
            >
              {diet ? 'Regenerate Diet Plan' : 'Generate Diet Plan'}
            </button>
            {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Planner Inputs</p>
            <div className="mt-5 grid gap-3">
              {[
                ['BMI', diet?.bmi || '--'],
                ['BMI category', diet?.bmiCategory || '--'],
                ['Daily calories', diet?.dailyCalories ? `${diet.dailyCalories} kcal` : '--'],
                ['Protein', diet?.macros?.protein ? `${diet.macros.protein} g` : '--'],
                ['Carbs', diet?.macros?.carbs ? `${diet.macros.carbs} g` : '--'],
                ['Fat', diet?.macros?.fat ? `${diet.macros.fat} g` : '--'],
                ['Hydration', diet?.hydrationLiters ? `${diet.hydrationLiters} L` : '--'],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-list-row">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fitai-ref-kicker">Diet Adherence</p>
                <p className="mt-2 text-sm text-slate-400">Today's completion against the latest generated plan.</p>
              </div>
              <div className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                {adherence.completionRate || 0}%
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200"
                style={{ width: `${adherence.completionRate || 0}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ['Completed meals', adherence.completedToday?.length || 0],
                ['Checklist target', adherence.plan?.meals?.length || diet?.meals?.length || 0],
                ['History entries', adherence.entries?.length || 0],
                ['Weekly adherence', `${adherence.weeklyCompletionRate || 0}%`],
              ].map(([label, value]) => (
                <div key={label} className="fitai-ref-list-row">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fitai-ref-kicker">Grocery Checklist</p>
                <p className="mt-2 text-sm text-slate-400">Checklist progress now stays synced with your active diet plan.</p>
              </div>
              <div className="rounded-full bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100">
                {groceryProgress}%
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {groceryList.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggleGroceryItem(item.name)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    item.checked
                      ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                      : 'border-slate-700 text-slate-300 hover:border-amber-300/40'
                  }`}
                >
                  {item.checked ? 'Done | ' : ''}
                  {item.name}
                </button>
              ))}
              {groceryList.length === 0 && <p className="text-sm text-slate-400">Generate a plan to build your grocery list.</p>}
            </div>
          </div>

          <div className="fitai-ref-app-card p-6">
            <p className="fitai-ref-kicker">Diet History</p>
            <div className="mt-5 space-y-3">
              {history.length === 0 && <p className="text-sm text-slate-400">Your generated plans will appear here.</p>}
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDiet(item);
                    setMessage(item.id === adherence.plan?.id ? '' : 'Viewing an older plan snapshot.');
                  }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      diet?.id === item.id
                      ? 'border-rose-400/40 bg-rose-500/10'
                      : 'fitai-ref-app-card-soft'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {new Date(item.createdAt).toLocaleDateString()} | {item.dailyCalories} kcal
                  </p>
                  <p className="mt-2 text-sm text-slate-400 capitalize">
                    {item.goal?.replace('_', ' ')} | BMI {item.bmi} | {item.bmiCategory}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="fitai-ref-app-card p-6">
          <p className="fitai-ref-kicker">Meal Plan</p>
          <h2 className="fitai-ref-app-title mt-3">
            {selectedPlanIsLatest ? 'Daily diet structure' : 'Historical diet snapshot'}
          </h2>

          {loading && <p className="mt-5 text-sm text-slate-400">Loading latest diet plan...</p>}
          {!loading && !diet && <p className="mt-5 text-sm text-slate-400">Generate your first plan to see meals and macros.</p>}

          <div className="mt-6 grid gap-4">
            {diet?.meals?.map((meal) => {
              const completed = adherence.completedToday?.includes(meal.name) && selectedPlanIsLatest;

              return (
                <div key={meal.name} className="fitai-ref-app-card-soft p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-white">{meal.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{meal.calories} kcal</p>
                    </div>
                    <div className="rounded-full bg-amber-300/12 px-4 py-2 text-sm text-amber-100">
                      Protein {meal.nutrients.protein}g | Carbs {meal.nutrients.carbs}g | Fat {meal.nutrients.fat}g
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {meal.foods.map((food) => (
                      <span key={food} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                        {food}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => markMealComplete(meal.name)}
                      disabled={!selectedPlanIsLatest || completed}
                      className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {completed ? 'Completed Today' : 'Mark Complete'}
                    </button>
                    {!selectedPlanIsLatest ? (
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Checklist works on the latest plan only</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {diet?.notes?.length > 0 && (
            <div className="fitai-ref-app-card-soft mt-6 p-5">
              <p className="text-lg font-semibold text-white">Coach notes</p>
              <div className="mt-4 space-y-2">
                {diet.notes.map((note) => (
                  <p key={note} className="text-sm text-slate-300">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {diet && (
            <div className="fitai-ref-app-card-soft mt-6 p-5">
              <p className="text-lg font-semibold text-white">Plan snapshot</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ['Calories', `${diet.dailyCalories} kcal`],
                  ['Protein target', `${diet.macros?.protein || 0} g`],
                  ['Hydration', `${diet.hydrationLiters || 0} L`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Diet;
