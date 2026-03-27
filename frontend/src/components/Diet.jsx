import { useEffect, useState } from 'react';
import Layout from './Layout';
import api from '../lib/api';

function Diet() {
  const [diet, setDiet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDiet = async () => {
    setLoading(true);
    try {
      const response = await api.get('/diet');
      setDiet(response.data);
    } catch (_error) {
      setDiet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet();
  }, []);

  const generateDiet = async () => {
    const response = await api.post('/diet/generate');
    setDiet(response.data);
  };

  return (
    <Layout
      title="Diet Planner"
      subtitle="Generate a BMI-aware meal plan using your goal, activity level, and training preferences. FitAI keeps calories, macros, hydration, and meals aligned."
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <div className="hero-gradient glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-emerald-300">Nutrition Engine</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">AI-ready diet planning</h2>
            <p className="mt-3 text-slate-300">
              The current version uses rule-based logic with BMI, goal, and activity level. It is structured so you can
              later swap in an LLM nutrition planner without changing the UI.
            </p>
            <button
              type="button"
              onClick={generateDiet}
              className="mt-6 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              {diet ? 'Regenerate Diet Plan' : 'Generate Diet Plan'}
            </button>
          </div>

          <div className="glass-card glass-morphism rounded-[2rem] p-6">
            <p className="section-title text-sm font-semibold text-cyan-300">Planner Inputs</p>
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
                <div key={label} className="glass-morphism flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="glass-card glass-morphism rounded-[2rem] p-6">
          <p className="section-title text-sm font-semibold text-amber-300">Meal Plan</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Daily diet structure</h2>

          {loading && <p className="mt-5 text-sm text-slate-400">Loading latest diet plan...</p>}
          {!loading && !diet && <p className="mt-5 text-sm text-slate-400">Generate your first plan to see meals and macros.</p>}

          <div className="mt-6 grid gap-4">
            {diet?.meals?.map((meal) => (
              <div key={meal.name} className="glass-morphism rounded-3xl p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-white">{meal.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{meal.calories} kcal</p>
                  </div>
                  <div className="rounded-full bg-amber-300/12 px-4 py-2 text-sm text-amber-100">
                    Protein {meal.nutrients.protein}g - Carbs {meal.nutrients.carbs}g - Fat {meal.nutrients.fat}g
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {meal.foods.map((food) => (
                    <span key={food} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {diet?.notes?.length > 0 && (
            <div className="glass-morphism mt-6 rounded-3xl p-5">
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
        </section>
      </div>
    </Layout>
  );
}

export default Diet;
