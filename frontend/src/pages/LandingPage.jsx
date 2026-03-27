import {
  FaArrowRight,
  FaBrain,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaDumbbell,
  FaFire,
  FaGithub,
  FaHeartbeat,
  FaInstagram,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPlay,
  FaQuoteLeft,
  FaRobot,
  FaRocket,
  FaShieldAlt,
  FaStar,
  FaTrophy,
  FaTwitter,
  FaUserAstronaut,
  FaUtensils,
} from 'react-icons/fa';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  {
    icon: FaDumbbell,
    title: 'AI Personal Trainer',
    description:
      'Real-time workout tracking and personalized exercise suggestions based on your goals and progress.',
    accent: 'from-fuchsia-500 to-cyan-500',
  },
  {
    icon: FaUtensils,
    title: 'Smart Diet Planner',
    description:
      'Generates calorie and macro-aware diet plans using BMI and activity level for practical daily nutrition.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FaTrophy,
    title: 'Progress and Rewards',
    description:
      'Tracks weight, workout consistency, performance, streaks, badges, and points to keep you motivated.',
    accent: 'from-amber-500 to-orange-500',
  },
];

const workflowSteps = [
  ['Login Securely', 'Access your personalized fitness dashboard with secure authentication.', FaShieldAlt],
  ['Set Profile and Goals', 'Define your fitness goal, activity level, and preferred workout location.', FaUserAstronaut],
  ['Start Workout Session', 'Begin an AI-guided workout session with structured session defaults.', FaPlay],
  ['Track Sets, Reps and Time', 'Log your exercise performance with a clean workout flow.', FaClock],
  ['Get Next Exercise Suggestion', 'FitAI recommends the next best movement from your recent history.', FaBrain],
  ['Update Progress and Rewards', 'Earn streaks, badges, and points while your progress charts update.', FaTrophy],
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    subtitle: 'Perfect for getting started with the workflow',
    features: ['AI workout suggestions', 'Basic progress tracking', 'Home and gym mode'],
  },
  {
    name: 'Pro',
    price: '$9/mo',
    subtitle: 'Best for regular users who want deeper personalization',
    features: ['Advanced recommendations', 'Diet planning', 'Streak rewards and badges', 'Priority AI insights'],
    highlighted: true,
  },
  {
    name: 'Coach',
    price: '$19/mo',
    subtitle: 'Useful for communities, trainers, and power users',
    features: ['Everything in Pro', 'Expanded analytics', 'Priority support', 'Team-ready guidance'],
  },
];

const faqItems = [
  {
    question: 'Can FitAI work for both gym and home workouts?',
    answer:
      'Yes. Users choose their workout location, and recommendations shift between gym equipment plans and no-equipment home routines.',
  },
  {
    question: 'How does the recommendation engine work?',
    answer:
      'The current engine is rule-based. It uses your goal, activity level, location, and recent workouts to build a practical plan.',
  },
  {
    question: 'Does the app also handle progress and rewards?',
    answer:
      'Yes. FitAI tracks workout consistency, weight progress, reward points, and streak badges in the same dashboard flow.',
  },
];

const trustHighlights = [
  'Built for gym and home workouts',
  'Secure login and profile flow',
  'AI guidance, diet, progress, and rewards in one dashboard',
];

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="fitai-shell fitai-grid min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <nav className="relative z-10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 shadow-lg">
              <FaDumbbell className="text-xl text-white" />
            </div>
            <span className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent">
              FitAI
            </span>
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <a href="#features" className="text-sm text-slate-300 transition hover:text-fuchsia-300">
              Features
            </a>
            <a href="#workflow" className="text-sm text-slate-300 transition hover:text-fuchsia-300">
              Workflow
            </a>
            <a href="#pricing" className="text-sm text-slate-300 transition hover:text-fuchsia-300">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-slate-300 transition hover:text-fuchsia-300">
              FAQ
            </a>
            <a href="#contact" className="text-sm text-slate-300 transition hover:text-fuchsia-300">
              Contact
            </a>
          </div>

          <div className="flex gap-3">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-full px-5 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-lg"
                >
                  Create Account
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-lg"
              >
                Dashboard <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative z-10 px-6 pb-16 pt-8 md:pb-24 md:pt-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-4 py-2 text-sm text-fuchsia-300">
              <FaRobot className="text-xs" />
              AI-Powered Smart Trainer
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
              <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                Smart Virtual
              </span>
              <br />
              <span className="text-white">Trainer for</span>
              <br />
              <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                Everyone
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              FitAI combines workout tracking, AI coaching, diet planning, progress insights, and reward-based
              motivation in one immersive experience for gym users and home workout users.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {trustHighlights.map((item) => (
                <span key={item} className="status-pill">
                  <FaCheckCircle className="text-[0.7rem]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="cta-primary flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-white"
              >
                Start Free Trial <FaRocket />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="glass-morphism flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white"
              >
                <FaPlay /> Login to Continue
              </button>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-5 border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl font-bold text-fuchsia-300 md:text-4xl">15k+</p>
                <p className="mt-2 text-sm text-slate-400">Active users</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-cyan-300 md:text-4xl">500k+</p>
                <p className="mt-2 text-sm text-slate-400">Workouts completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-300 md:text-4xl">98%</p>
                <p className="mt-2 text-sm text-slate-400">Satisfaction rate</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card hero-gradient hero-3d rounded-[2rem] p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-fuchsia-400" />
                  <span className="h-3 w-3 rounded-full bg-cyan-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <FaBrain className="text-xl text-fuchsia-300" />
              </div>

              <div className="space-y-4">
                <div className="floating-panel rounded-2xl p-4">
                  <p className="text-sm text-slate-400">Current streak</p>
                  <p className="mt-1 text-2xl font-bold text-white">7 days</p>
                </div>
                <div className="floating-panel floating-delay-2 rounded-2xl p-4">
                  <p className="text-sm text-slate-400">Calories burned</p>
                  <p className="mt-1 text-2xl font-bold text-white">2,450</p>
                </div>
                <div className="floating-panel floating-delay-3 rounded-2xl p-4">
                  <p className="text-sm text-slate-400">Next workout</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">Full Body</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">AI Coach Says</p>
                <p className="mt-2 text-slate-100">Great progress. Ready for your next challenge?</p>
              </div>
            </div>

            <div className="absolute -left-4 -top-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 shadow-2xl">
              <GiWeightLiftingUp className="text-3xl text-white" />
            </div>
            <div className="absolute -bottom-5 -right-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-2xl">
              <FaHeartbeat className="text-3xl text-white" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="section-title text-sm text-fuchsia-300">Why FitAI</p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">Transform your fitness journey</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Instead of separating logging, planning, and motivation, FitAI connects them into one loop so every
              session improves the next one.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="feature-panel glass-morphism rounded-3xl p-8">
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${card.accent}`}
                  >
                    <Icon className="text-3xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-6">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="metric-glow glass-morphism rounded-3xl p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-300">Workout Flow</p>
            <p className="mt-3 text-2xl font-bold text-white">Track sets, reps, and duration in one session view.</p>
          </div>
          <div className="metric-glow glass-morphism rounded-3xl p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">AI Layer</p>
            <p className="mt-3 text-2xl font-bold text-white">Rule-based coaching that is ready for future LLM upgrades.</p>
          </div>
          <div className="metric-glow glass-morphism rounded-3xl p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Motivation</p>
            <p className="mt-3 text-2xl font-bold text-white">Progress charts, badges, points, and streak rewards built in.</p>
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="section-title text-sm text-fuchsia-300">Workflow</p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">Train smarter, not harder</h2>
            <p className="mt-4 text-lg text-slate-300">The whole product follows one clean fitness loop.</p>
          </div>

          <div className="space-y-6">
            {workflowSteps.map(([title, description, Icon], index) => (
              <div key={title} className="glass-morphism flex flex-col gap-5 rounded-3xl p-6 md:flex-row md:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-xl font-bold text-white shadow-lg">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Icon className="text-lg text-fuchsia-300" />
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                  </div>
                  <p className="mt-2 text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-gradient-to-r from-fuchsia-950/50 to-cyan-950/50 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          {[
            [FaFire, '15k+', 'Active Users'],
            [FaDumbbell, '500k+', 'Workouts Completed'],
            [FaStar, '4.9/5', 'User Rating'],
            [FaChartLine, '98%', 'Success Rate'],
          ].map(([Icon, value, label]) => (
            <div key={label} className="glass-morphism rounded-3xl p-6 text-center">
              <Icon className="mx-auto text-4xl text-fuchsia-300" />
              <p className="mt-4 text-4xl font-bold text-white">{value}</p>
              <p className="mt-2 text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="section-title text-sm text-fuchsia-300">Testimonials</p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">What our users say</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              ['Sarah Johnson', 'Fitness Enthusiast', 'FitAI completely transformed my workout routine. The AI suggestions keep me challenged.', 'SJ'],
              ['Mike Chen', 'Busy Professional', 'The home workouts are practical and finally fit my schedule.', 'MC'],
              ['Emma Davis', 'Beginner', 'The guidance and workout structure gave me confidence to start.', 'ED'],
            ].map(([name, role, quote, avatar]) => (
              <div key={name} className="glass-morphism rounded-3xl p-6">
                <FaQuoteLeft className="text-3xl text-fuchsia-400/60" />
                <p className="mt-4 text-slate-300">"{quote}"</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 font-bold text-white">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{name}</p>
                    <p className="text-sm text-slate-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="section-title text-sm text-fuchsia-300">Pricing</p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">Simple plans for every stage</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Start free, unlock deeper personalization when you need it, and scale into a more premium coaching flow.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-morphism rounded-3xl p-8 ${plan.highlighted ? 'border-fuchsia-400/40 bg-fuchsia-500/10' : ''}`}
              >
                {plan.highlighted ? (
                  <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Most Popular
                  </div>
                ) : null}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-slate-400">{plan.subtitle}</p>
                <p className="mt-6 text-5xl font-bold text-white">{plan.price}</p>
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <FaCheckCircle className="mt-1 text-sm text-emerald-300" />
                      <p className="text-slate-300">{feature}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/signup')}
                  className={`mt-8 w-full rounded-full px-5 py-3 font-semibold ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white'
                      : 'glass-morphism text-slate-100'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="section-title text-sm text-fuchsia-300">FAQ</p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">Answers before you start</h2>
          </div>

          <div className="space-y-5">
            {faqItems.map((item) => (
              <div key={item.question} className="feature-panel glass-morphism rounded-3xl p-6">
                <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                <p className="mt-3 text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="glass-morphism rounded-3xl p-8">
            <p className="section-title text-sm text-fuchsia-300">Contact</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Talk to the FitAI team</h2>
            <p className="mt-4 text-slate-300">
              Whether you want product access, a premium plan, or help setting up your workflow, we can guide you.
            </p>

            <div className="mt-8 space-y-4">
              {[
                [FaEnvelope, 'Email', 'hello@fitai.app'],
                [FaPhoneAlt, 'Phone', '+91 98765 43210'],
                [FaMapMarkerAlt, 'Location', 'Remote-first, India'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="glass-morphism flex items-center gap-4 rounded-2xl px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-600">
                    <Icon className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="font-medium text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-morphism rounded-3xl p-8">
            <h3 className="text-2xl font-semibold text-white">Best demo flow</h3>
            <p className="mt-3 text-slate-300">
              Landing page to Signup to Onboarding to Dashboard to Workout to Progress to Diet.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <button
                onClick={() => navigate('/signup')}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-4 font-semibold text-white shadow-lg"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="glass-morphism rounded-2xl px-6 py-4 font-semibold text-slate-100"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20">
        <div className="glass-card mx-auto max-w-5xl rounded-[2rem] p-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to transform your fitness?</h2>
          <p className="mt-4 text-lg text-slate-300">
            Join FitAI and move through the complete workout, progress, diet, and rewards cycle.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="cta-primary mx-auto mt-8 flex items-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-white"
          >
            Start Your Journey <FaArrowRight />
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FaDumbbell className="text-xl text-fuchsia-400" />
                <span className="text-xl font-bold text-white">FitAI</span>
              </div>
              <p className="text-sm text-slate-400">Smart Virtual Trainer powered by AI</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-white">Product</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <a href="#features" className="block transition hover:text-fuchsia-400">
                  Features
                </a>
                <a href="#workflow" className="block transition hover:text-fuchsia-400">
                  Workflow
                </a>
                <a href="#pricing" className="block transition hover:text-fuchsia-400">
                  Pricing
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-white">Company</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <a href="#faq" className="block transition hover:text-fuchsia-400">
                  FAQ
                </a>
                <a href="#contact" className="block transition hover:text-fuchsia-400">
                  Contact
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-white">Social</h4>
              <div className="flex gap-4 text-lg text-slate-400">
                <a href="/" className="transition hover:text-fuchsia-400">
                  <FaTwitter />
                </a>
                <a href="/" className="transition hover:text-fuchsia-400">
                  <FaInstagram />
                </a>
                <a href="/" className="transition hover:text-fuchsia-400">
                  <FaGithub />
                </a>
                <a href="/" className="transition hover:text-fuchsia-400">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-sm text-slate-400">
            Copyright 2024 FitAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
