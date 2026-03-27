import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
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
import { useAuth } from '../context/AuthContext';

function StatCounter({ end, suffix = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true });

  return (
    <div ref={ref}>
      <div className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
        {inView ? <CountUp end={end} duration={2.5} decimals={end % 1 !== 0 ? 1 : 0} /> : 0}
        {suffix}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="glass-morphism rounded-2xl p-8"
    >
      <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="text-3xl text-white" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
      <p className="leading-relaxed text-slate-300">{description}</p>
    </motion.div>
  );
}

function WorkflowStep({ number, title, description, icon: Icon, delay, reverse = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: reverse ? 80 : -80 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-6 md:flex-row"
    >
      <div className={`${reverse ? 'md:order-2' : ''} relative flex-shrink-0`}>
        <div className="animate-glow-pulse flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-2xl font-bold text-white">
          {number}
        </div>
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="mb-3 flex items-center justify-center gap-3 md:justify-start">
          <Icon className="text-xl text-fuchsia-400" />
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-300">{description}</p>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ name, role, content, avatar, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="glass-morphism rounded-2xl p-6"
    >
      <FaQuoteLeft className="mb-4 text-3xl text-fuchsia-400/50" />
      <p className="mb-6 text-slate-300">"{content}"</p>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 font-bold text-white">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-slate-400">{role}</p>
          <div className="mt-1 flex gap-1">
            {[...Array(5)].map((_, index) => (
              <FaStar key={index} className="text-xs text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    tagline: 'Great for trying the FitAI workflow',
    features: ['AI workout suggestions', 'Basic progress tracking', 'Home and gym mode'],
    cta: 'Start Free',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    tagline: 'Best for regular athletes and serious consistency',
    features: ['Advanced workout personalization', 'Diet planning', 'Streak rewards and badges', 'Priority AI recommendations'],
    cta: 'Choose Pro',
    featured: true,
  },
  {
    name: 'Coach',
    price: '$19',
    period: '/month',
    tagline: 'For teams, communities, and trainers',
    features: ['Everything in Pro', 'Multi-user progress oversight', 'Priority support', 'Expanded analytics'],
    cta: 'Contact Sales',
  },
];

const faqItems = [
  {
    question: 'Can FitAI work for both gym and home workouts?',
    answer: 'Yes. During signup and onboarding, users choose their training location, and FitAI adjusts recommendations for home or gym setups.',
  },
  {
    question: 'How does the AI recommendation engine work?',
    answer: 'The current engine uses rules based on your goal, activity level, location, and recent workout history. It is structured to support future LLM upgrades.',
  },
  {
    question: 'Does FitAI also help with diet and consistency?',
    answer: 'Yes. FitAI includes diet planning, weight and workout progress views, streak tracking, points, and badges to keep users engaged.',
  },
  {
    question: 'Is onboarding required every time?',
    answer: 'No. Onboarding is a quick first-time setup step. After that, users can update their preferences later from the dashboard.',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-fuchsia-500"
        style={{ scaleX, transformOrigin: '0%' }}
      />

      <motion.div
        className="pointer-events-none fixed left-16 top-16 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl"
        animate={{ x: mousePosition.x * 0.015, y: mousePosition.y * 0.015 }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-16 right-16 h-80 w-80 rounded-full bg-cyan-600/20 blur-3xl"
        animate={{ x: mousePosition.x * -0.015, y: mousePosition.y * -0.015 }}
      />

      <nav className="relative z-20 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500">
              <FaDumbbell className="text-xl text-white" />
            </div>
            <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
              FitAI
            </span>
          </div>

          <div className="hidden items-center gap-5 lg:flex">
            {[
              ['#features', 'Features'],
              ['#workflow', 'Workflow'],
              ['#pricing', 'Pricing'],
              ['#faq', 'FAQ'],
              ['#contact', 'Contact'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-300 transition hover:text-fuchsia-300">
                {label}
              </a>
            ))}
          </div>

          <div className="flex gap-4">
            {!isAuthenticated ? (
              <>
                <button onClick={() => navigate('/login')} className="px-6 py-2 font-medium text-white transition hover:text-fuchsia-300">
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2 font-semibold text-white shadow-lg"
                >
                  Create Account
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-2 font-semibold text-white"
              >
                Go to Dashboard <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative z-10 px-6 py-12 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/20 px-4 py-2">
              <FaRobot className="text-sm text-fuchsia-400" />
              <span className="text-sm text-fuchsia-300">AI-Powered Smart Trainer</span>
            </div>

            <h1 className="mb-6 text-5xl font-bold md:text-7xl">
              <span className="animate-gradient bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                Smart Virtual
              </span>
              <br />
              <span className="text-white">Trainer for</span>
              <br />
              <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                Everyone
              </span>
            </h1>

            <p className="mb-8 text-xl leading-relaxed text-slate-300">
              FitAI turns fitness tracking, AI coaching, diet planning, and motivation into one immersive platform.
              Built for gym users and home workout users, FitAI helps you train with structure, see progress clearly,
              and stay consistent with reward-driven momentum.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-xl"
              >
                Start Free Trial <FaRocket />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="glass-morphism flex items-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-white"
              >
                <FaPlay /> Watch Demo
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <StatCounter end={15000} suffix="+" />
                <p className="mt-1 text-sm text-slate-400">Active Users</p>
              </div>
              <div>
                <StatCounter end={500000} suffix="+" />
                <p className="mt-1 text-sm text-slate-400">Workouts Completed</p>
              </div>
              <div>
                <StatCounter end={98} suffix="%" />
                <p className="mt-1 text-sm text-slate-400">Satisfaction Rate</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="glass-morphism relative rounded-3xl p-8">
              <div className="absolute -right-4 -top-4 h-20 w-20 animate-pulse rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 blur-2xl" />
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-3 w-3 rounded-full bg-fuchsia-400" />
                  ))}
                </div>
                <FaBrain className="text-xl text-fuchsia-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-white">Current Streak</span>
                  <span className="text-2xl font-bold text-fuchsia-400">7 days</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-white">Calories Burned</span>
                  <span className="text-2xl font-bold text-cyan-400">2,450</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-white">Next Workout</span>
                  <span className="text-emerald-400">Full Body</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 p-4">
                <p className="text-sm text-fuchsia-300">AI Coach Says:</p>
                <p className="mt-1 text-sm text-white">Great progress! Ready for your next challenge?</p>
              </div>
            </div>

            <div className="absolute -left-8 -top-8 flex h-16 w-16 animate-float-slow items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 shadow-2xl">
              <GiWeightLiftingUp className="text-3xl text-white" />
            </div>
            <div className="absolute -bottom-8 -right-8 flex h-16 w-16 animate-float-slow items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-2xl [animation-delay:1s]">
              <FaHeartbeat className="text-3xl text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">Why FitAI?</span>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Transform Your Fitness Journey</h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-300">
              Instead of separating logging, planning, and motivation, FitAI connects them into one feedback loop so every session improves the next one.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={FaDumbbell} title="AI Personal Trainer" description="Real-time workout tracking and personalized exercise suggestions based on your goals and progress." color="from-fuchsia-500 to-cyan-500" delay={0.1} />
            <FeatureCard icon={FaUtensils} title="Smart Diet Planner" description="Generates calorie and macro-aware diet plans using BMI and activity level for optimal nutrition." color="from-emerald-500 to-teal-500" delay={0.2} />
            <FeatureCard icon={FaTrophy} title="Progress and Rewards" description="Tracks weight, workout consistency, performance, streaks, badges, and points to keep you motivated." color="from-amber-500 to-orange-500" delay={0.3} />
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">Simple Workflow</span>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Train Smarter, Not Harder</h2>
            <p className="text-xl text-slate-300">Follow our proven system for consistent results</p>
          </div>

          <div className="space-y-10">
            <WorkflowStep number={1} title="Login Securely" description="Access your personalized fitness dashboard with secure authentication" icon={FaShieldAlt} delay={0.1} />
            <WorkflowStep number={2} title="Set Profile and Goals" description="Define your fitness goals, experience level, and preferred workout location" icon={FaUserAstronaut} delay={0.2} reverse />
            <WorkflowStep number={3} title="Start Workout Session" description="Begin your AI-guided workout with real-time tracking and motivation" icon={FaPlay} delay={0.3} />
            <WorkflowStep number={4} title="Track Sets, Reps and Time" description="Log your performance with intuitive controls and progress indicators" icon={FaClock} delay={0.4} reverse />
            <WorkflowStep number={5} title="Get Next Exercise Suggestion" description="AI recommends the optimal next exercise based on your energy and progress" icon={FaBrain} delay={0.5} />
            <WorkflowStep number={6} title="Update Progress and Rewards" description="Earn badges, maintain streaks, and track your improvement over time" icon={FaTrophy} delay={0.6} reverse />
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-gradient-to-r from-fuchsia-950/50 to-cyan-950/50 px-6 py-20">
        <div className="mx-auto max-w-7xl grid gap-8 text-center md:grid-cols-4">
          {[
            { icon: FaFire, value: 15000, label: 'Active Users', suffix: '+' },
            { icon: FaDumbbell, value: 500000, label: 'Workouts Completed', suffix: '+' },
            { icon: FaStar, value: 4.9, label: 'User Rating', suffix: '/5' },
            { icon: FaChartLine, value: 98, label: 'Success Rate', suffix: '%' },
          ].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: index * 0.1 }} viewport={{ once: true }} className="glass-morphism rounded-2xl p-6">
              <stat.icon className="mx-auto mb-4 text-4xl text-fuchsia-400" />
              <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
                <CountUp end={stat.value} duration={2.5} decimals={stat.value % 1 !== 0 ? 1 : 0} />
                {stat.suffix}
              </div>
              <p className="text-slate-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">Success Stories</span>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">What Our Users Say</h2>
            <p className="text-xl text-slate-300">Join thousands of satisfied users who transformed their fitness</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <TestimonialCard name="Sarah Johnson" role="Fitness Enthusiast" content="FitAI completely transformed my workout routine. The AI suggestions are spot-on and keep me challenged!" avatar="SJ" delay={0.1} />
            <TestimonialCard name="Mike Chen" role="Busy Professional" content="Finally found a fitness app that actually works for my schedule. The home workouts are perfect!" avatar="MC" delay={0.2} />
            <TestimonialCard name="Emma Davis" role="Beginner" content="As someone new to fitness, the guidance and video tutorials gave me the confidence to start my journey." avatar="ED" delay={0.3} />
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">Pricing</span>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Simple plans for every fitness stage</h2>
            <p className="mx-auto max-w-3xl text-xl text-slate-300">
              Start free, unlock deeper personalization when you need it, and scale into a more premium coaching experience later.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`glass-morphism rounded-3xl p-8 ${plan.featured ? 'border-fuchsia-400/50 bg-fuchsia-500/10' : ''}`}
              >
                {plan.featured && (
                  <div className="mb-5 inline-flex rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-slate-400">{plan.tagline}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="pb-1 text-slate-400">{plan.period}</span>}
                </div>
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <FaCheckCircle className="mt-1 text-sm text-emerald-300" />
                      <p className="text-sm text-slate-300">{feature}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(plan.name === 'Coach' ? '/signup' : '/signup')}
                  className={`mt-8 w-full rounded-full px-5 py-3 font-semibold transition ${
                    plan.featured
                      ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white'
                      : 'glass-morphism text-slate-100'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">FAQ</span>
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Answers before you start</h2>
            <p className="text-xl text-slate-300">A few common questions users ask before joining the platform.</p>
          </div>

          <div className="space-y-5">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="glass-morphism rounded-3xl p-6"
              >
                <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                <p className="mt-3 text-slate-300">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 bg-black/30 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-morphism rounded-3xl p-8">
            <span className="mb-4 inline-block rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm text-fuchsia-300">Contact</span>
            <h2 className="text-4xl font-bold text-white">Talk to the FitAI team</h2>
            <p className="mt-4 text-slate-300">
              Whether you want product access, a premium plan, or help setting up your workflow, we can point you in the right direction.
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
            <h3 className="text-2xl font-semibold text-white">Need a walkthrough?</h3>
            <p className="mt-3 text-slate-300">
              Start by creating an account, then move through onboarding and into the dashboard for the full product experience.
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

            <div className="mt-8 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-300">Best for demo flow</p>
              <p className="mt-3 text-slate-200">
                Landing page to Signup to Onboarding to Dashboard to Workout to Progress to Diet
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20">
        <div className="glass-morphism relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Ready to Transform Your Fitness?</h2>
            <p className="mb-8 text-xl text-slate-300">Join thousands of users who are already achieving their fitness goals with FitAI</p>
            <button onClick={() => navigate('/signup')} className="mx-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-xl">
              Start Your Journey <FaArrowRight />
            </button>
          </div>
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
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="transition hover:text-fuchsia-400">Features</a></li>
                <li><a href="#workflow" className="transition hover:text-fuchsia-400">Workflow</a></li>
                <li><a href="#pricing" className="transition hover:text-fuchsia-400">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#faq" className="transition hover:text-fuchsia-400">FAQ</a></li>
                <li><a href="#testimonials" className="transition hover:text-fuchsia-400">Testimonials</a></li>
                <li><a href="#contact" className="transition hover:text-fuchsia-400">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/" className="transition hover:text-fuchsia-400">Privacy</a></li>
                <li><a href="/" className="transition hover:text-fuchsia-400">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-sm text-slate-400">Copyright 2024 FitAI. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="/" className="text-slate-400 transition hover:text-fuchsia-400"><FaTwitter /></a>
              <a href="/" className="text-slate-400 transition hover:text-fuchsia-400"><FaInstagram /></a>
              <a href="/" className="text-slate-400 transition hover:text-fuchsia-400"><FaGithub /></a>
              <a href="/" className="text-slate-400 transition hover:text-fuchsia-400"><FaLinkedin /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
