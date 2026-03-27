import { Link } from 'react-router-dom';
import PublicHeader from './PublicHeader';

const featureCards = [
  {
    title: 'AI Workout Engine',
    copy: 'Reads your goal, workout history, and training location to build smarter exercise flows.',
  },
  {
    title: 'Diet Planner',
    copy: 'Generates calorie and macro-aware diet plans using BMI and activity level.',
  },
  {
    title: 'Progress + Rewards',
    copy: 'Tracks weight, workout consistency, performance, streaks, badges, and points.',
  },
];

const workflow = [
  'Login securely',
  'Set profile and fitness goals',
  'Start a workout session',
  'Track sets, reps, and time',
  'Get the next exercise suggestion',
  'Watch guidance video',
  'Update progress and rewards',
  'Repeat the cycle',
];

function About() {
  return (
    <div className="fitai-shell fitai-grid min-h-screen">
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
        <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-3d glass-card glass-morphism rounded-[2rem] p-8 sm:p-10">
            <span className="status-pill">Smart Virtual Trainer</span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              FitAI turns fitness tracking, AI coaching, diet planning, and motivation into one immersive platform.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
              Built for gym users and home workout users, FitAI helps you train with structure, see progress clearly,
              and stay consistent with reward-driven momentum.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-slate-600 px-6 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-white"
              >
                Login
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((card, index) => (
                <article key={card.title} className={`glass-morphism floating-panel floating-delay-${index + 1} rounded-3xl p-5`}>
                  <p className="text-lg font-semibold text-white">{card.title}</p>
                  <p className="mt-3 text-sm text-slate-300">{card.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="glass-card glass-morphism tilt-card rounded-[2rem] p-6">
              <p className="section-title text-sm font-semibold text-cyan-300">About FitAI</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Why this product stands out</h2>
              <p className="mt-4 text-slate-300">
                Instead of separating logging, planning, and motivation, FitAI connects them into one feedback loop so
                every session improves the next one.
              </p>
            </section>

            <section className="glass-card glass-morphism tilt-card rounded-[2rem] p-6">
              <p className="section-title text-sm font-semibold text-amber-300">Workflow</p>
              <div className="mt-5 space-y-3">
                {workflow.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default About;
