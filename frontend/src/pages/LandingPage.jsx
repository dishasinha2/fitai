import { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaCheck, FaDumbbell, FaPlay, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  {
    number: '01',
    icon: 'AI',
    title: 'AI Coaching',
    description: 'Real-time feedback, adaptive programming, and next-move recommendations based on your performance history.',
  },
  {
    number: '02',
    icon: 'PR',
    title: 'Progress Analytics',
    description: 'Visual PR charts, volume load trends, body composition tracking, and weekly performance scores.',
  },
  {
    number: '03',
    icon: 'DI',
    title: 'Nutrition Engine',
    description: 'BMI-aware meal plans, macro tracking, grocery checklists, and calorie targets that adjust daily.',
  },
  {
    number: '04',
    icon: 'HM',
    title: 'Gym and Home Modes',
    description: 'Fully equipped gym programs or zero-equipment bodyweight routines with the same quality either way.',
  },
  {
    number: '05',
    icon: 'RW',
    title: 'Rewards System',
    description: 'Points, streaks, badges, and reminders that make consistency feel genuinely rewarding.',
  },
  {
    number: '06',
    icon: 'AP',
    title: 'Auto Periodization',
    description: 'Smarter overload, deload weeks, and fatigue-aware recommendations handled automatically.',
  },
];

const splitList = [
  'AI adapts your program weekly based on real performance data',
  'Works equally well for gym athletes and home trainers',
  'Nutrition engine syncs automatically with your training load',
  'Streak system and badges reinforce long-term consistency',
  'Full progress analytics updated after every session',
];

const pricingPlans = [
  {
    tier: 'Starter',
    price: '0',
    per: 'Free forever',
    features: ['AI workout suggestions', 'Basic progress tracking', 'Home workout library'],
    disabled: ['Advanced AI coaching', 'Diet planning', 'Advanced analytics'],
  },
  {
    tier: 'Pro Athlete',
    price: '19',
    per: 'Per month, billed monthly',
    features: ['Unlimited workouts', 'Full AI coaching engine', 'Diet planning + macros', 'Advanced analytics', 'Rewards and streaks', 'Priority support'],
    highlighted: true,
  },
  {
    tier: 'Elite',
    price: '49',
    per: 'Per month, billed monthly',
    features: ['Everything in Pro', '1:1 coach access', 'Custom periodization', 'Team management', 'White-label option', 'Dedicated account manager'],
  },
];

const testimonials = [
  {
    rating: 5,
    quote:
      'The AI coaching actually adapts. After a few weeks it knew where I was plateauing and changed my strength block intelligently.',
    initials: 'RK',
    name: 'Rahul K.',
    role: 'Strength athlete',
  },
  {
    rating: 5,
    quote:
      'Finally a fitness app that does not separate training and diet. The nutrition sync with workout load is the real game changer.',
    initials: 'SA',
    name: 'Simran A.',
    role: 'Competitive athlete',
  },
  {
    rating: 5,
    quote:
      'Home workout mode is genuinely useful. Even while travelling, the routines and progression still feel serious and structured.',
    initials: 'MV',
    name: 'Mihail V.',
    role: 'Business traveler',
  },
  {
    rating: 4,
    quote:
      'The streak system is addictive in the best way. I open FitAI every morning because it keeps momentum visible.',
    initials: 'PJ',
    name: 'Priya J.',
    role: 'Fitness enthusiast',
  },
];

const marqueeItems = [
  'No Days Off',
  'AI Personal Training',
  'Smarter Nutrition',
  'Real Results',
  'Adaptive Coaching',
  'Track Every Set',
  'Build Consistency',
  'Beat Yesterday',
];

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#session', label: 'Workflow' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#footer', label: 'About' },
];

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [ring, setRing] = useState({ x: 0, y: 0 });
  const [timerSeconds, setTimerSeconds] = useState(42 * 60 + 17);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    const handleMove = (event) => {
      setCursor({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  useEffect(() => {
    let frameId;

    const animateRing = () => {
      setRing((current) => ({
        x: current.x + (cursor.x - current.x) * 0.12,
        y: current.y + (cursor.y - current.y) * 0.12,
      }));
      frameId = window.requestAnimationFrame(animateRing);
    };

    frameId = window.requestAnimationFrame(animateRing);
    return () => window.cancelAnimationFrame(frameId);
  }, [cursor]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimerSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedTimer = useMemo(() => {
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }, [timerSeconds]);

  return (
    <div className="fitai-ref-page">
      <div className="fitai-ref-cursor" style={{ left: cursor.x, top: cursor.y }} />
      <div className="fitai-ref-cursor-ring" style={{ left: ring.x, top: ring.y }} />

      <nav className={`fitai-ref-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <button type="button" onClick={() => navigate('/')} className="fitai-ref-logo">
          <span className="fitai-ref-logo-mark">
            <FaDumbbell />
          </span>
          <span className="fitai-ref-logo-word">FITAI</span>
        </button>

        <div className="fitai-ref-nav-center">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="fitai-ref-nav-right">
          <button type="button" className="fitai-ref-nav-plain" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
            {isAuthenticated ? 'Dashboard' : 'Sign In'}
          </button>
          <button type="button" className="fitai-ref-nav-btn" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}>
            {isAuthenticated ? 'Open App' : 'Start Free'}
          </button>
        </div>
      </nav>

      <section className="fitai-ref-hero">
        <div className="fitai-ref-hero-bg" />
        <div className="fitai-ref-hero-stripe" />
        <div className="fitai-ref-hero-overlay" />

        <div className="fitai-ref-hero-content">
          <div className="fitai-ref-eyebrow">
            <span className="line" />
            <span className="text">AI-Powered Training Platform</span>
          </div>

          <h1>
            <span className="w1">Train</span>
            <span className="w2">Harder.</span>
            <span className="w3">Think</span>
            <span className="w4">Smarter.</span>
          </h1>

          <p className="fitai-ref-hero-sub">
            FitAI adapts to your body, tracks every rep, plans your nutrition, and keeps you accountable with streaks,
            rewards, and real progress signals every single day.
          </p>

          <div className="fitai-ref-hero-actions">
            <button type="button" className="fitai-ref-btn-primary" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}>
              Begin Training <FaArrowRight />
            </button>
            <button type="button" className="fitai-ref-btn-watch" onClick={() => navigate('/workout')}>
              <span className="play-ring">
                <FaPlay />
              </span>
              Watch Demo
            </button>
          </div>
        </div>

        <div className="fitai-ref-hero-bar">
          {[
            ['15K+', 'Active Athletes'],
            ['500K+', 'Sessions Logged'],
            ['98%', 'Goal Achievement'],
            ['4.9★', 'User Rating'],
          ].map(([value, label]) => (
            <div key={label} className="hb-item">
              <span className="hb-line" />
              <div>
                <div className="hb-num">{value}</div>
                <div className="hb-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fitai-ref-marquee">
        <div className="fitai-ref-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`} className="mq-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="fitai-ref-split">
        <div className="split-img">
          <img
            src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&q=80"
            alt="Athlete training"
            loading="lazy"
          />
          <div className="split-img-ov" />
        </div>

        <div className="split-body">
          <div className="sec-label">
            <span className="sec-line" />
            <span className="sec-tag">Why FitAI</span>
          </div>
          <h2>
            Your Body.
            <br />
            Your Data.
            <br />
            Your Coach.
          </h2>
          <p className="body-p">
            FitAI connects workout tracking, AI guidance, diet planning, progress analytics, and long-term motivation
            into one serious system for gym athletes and home users.
          </p>

          <ul className="split-list">
            {splitList.map((item) => (
              <li key={item}>
                <span className="chk">
                  <FaCheck />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button type="button" className="fitai-ref-btn-primary fitai-ref-inline-btn" onClick={() => navigate('/dashboard')}>
            Explore Features <FaArrowRight />
          </button>
        </div>
      </section>

      <section className="fitai-ref-features" id="features">
        <div className="sec-hdr">
          <div>
            <div className="sec-label">
              <span className="sec-line" />
              <span className="sec-tag">Platform Features</span>
            </div>
            <h2>
              Everything You Need
              <br />
              To Perform.
            </h2>
          </div>
          <div className="hdr-note">
            Workout coaching, nutrition, progress, rewards, home mode, and adaptable planning built into one seamless
            product flow.
          </div>
        </div>

        <div className="feat-grid">
          {featureCards.map((feature) => (
            <div key={feature.title} className="feat-cell">
              <div className="feat-n">{feature.number}</div>
              <div className="feat-ico">{feature.icon}</div>
              <div className="feat-nm">{feature.title}</div>
              <p className="feat-d">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fitai-ref-strip">
        <div className="strip-bg" />
        <div className="strip-ov" />
        <div className="strip-txt">
          <h2>
            Forged In
            <br />
            <em>Every Rep.</em>
          </h2>
          <p className="strip-sub">Results do not happen in theory. They happen through consistency and clean execution.</p>
        </div>
      </section>

      <section className="fitai-ref-session" id="session">
        <div className="session-img">
          <img
            src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=80"
            alt="Live gym session"
            loading="lazy"
          />
          <div className="session-img-ov" />
        </div>

        <div className="session-body">
          <div className="sec-label">
            <span className="sec-line" />
            <span className="sec-tag">In Session</span>
          </div>
          <h2>
            Every Rep,
            <br />
            Every Set,
            <br />
            Tracked.
          </h2>
          <p className="body-p">
            Live workout flow gives you timers, next exercise suggestions, YouTube guidance, and session tracking in one
            focused view.
          </p>

          <div className="live-card">
            <div className="live-hdr">
              <div className="live-pill">
                <span className="pdot" />
                Live Session
              </div>
              <div className="timer">{formattedTimer}</div>
            </div>

            <div className="ex-list">
              <div className="ex-row done">
                <span className="ex-nm">Bench Press</span>
                <span className="ex-inf">4×6 · 100kg</span>
                <span className="ex-st st-done">Done</span>
              </div>
              <div className="ex-row done">
                <span className="ex-nm">Incline DB Press</span>
                <span className="ex-inf">3×8 · 32kg</span>
                <span className="ex-st st-done">Done</span>
              </div>
              <div className="ex-row active">
                <span className="ex-nm">Cable Flyes</span>
                <span className="ex-inf">Set 2/3 · 18kg</span>
                <span className="ex-st st-act">Active</span>
              </div>
              <div className="ex-row">
                <span className="ex-nm">Overhead Press</span>
                <span className="ex-inf">4×5 · 60kg</span>
                <span className="ex-st st-next">Next</span>
              </div>
              <div className="ex-row">
                <span className="ex-nm">Tricep Pushdown</span>
                <span className="ex-inf">3×12</span>
                <span className="ex-st st-next">Next</span>
              </div>
            </div>

            <div className="prog-sec">
              <div className="prog-lbl">
                <span>Progress</span>
                <span className="prog-pct">68%</span>
              </div>
              <div className="prog-bar">
                <div className="prog-fill" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fitai-ref-pricing" id="pricing">
        <div className="pricing-shell">
          <div className="pricing-head">
            <div className="sec-label">
              <span className="sec-line" />
              <span className="sec-tag">Pricing</span>
            </div>
            <h2>
              Simple. Transparent.
              <br />
              No Surprises.
            </h2>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div key={plan.tier} className={`pc ${plan.highlighted ? 'hot' : ''}`}>
                {plan.highlighted ? <div className="hot-tag">Most Popular</div> : null}
                <div className="plan-tier">{plan.tier}</div>
                <div className="plan-price">
                  <span className="cur">$</span>
                  {plan.price}
                </div>
                <div className="plan-per">{plan.per}</div>
                <div className="plan-div" />
                <ul className="plan-ul">
                  {plan.features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {plan.disabled?.map((item) => (
                    <li key={item} className="off">
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`plan-btn ${plan.highlighted ? 'hot-btn' : ''}`}
                  onClick={() => navigate(plan.highlighted ? '/signup' : '/login')}
                >
                  {plan.highlighted ? 'Start 7-Day Trial' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fitai-ref-testimonials" id="reviews">
        <div className="testi-left">
          <div className="sec-label">
            <span className="sec-line" />
            <span className="sec-tag">Reviews</span>
          </div>
          <h2>
            What Athletes
            <br />
            Are Saying.
          </h2>
          <p>Real results from people using FitAI for gym training, home workouts, progress tracking, and daily discipline.</p>
        </div>

        <div className="testi-grid">
          {testimonials.map((item) => (
            <div key={item.name} className="tc">
              <div className="tc-stars">
                {Array.from({ length: item.rating }).map((_, index) => (
                  <FaStar key={index} />
                ))}
              </div>
              <p className="tc-q">"{item.quote}"</p>
              <div className="tc-auth">
                <div className="tc-av">{item.initials}</div>
                <div>
                  <div className="tc-name">{item.name}</div>
                  <div className="tc-role">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer id="footer" className="fitai-ref-footer">
        <div className="ft-top">
          <div>
            <button type="button" onClick={() => navigate('/')} className="fitai-ref-logo fitai-ref-footer-logo">
              <span className="fitai-ref-logo-mark">
                <FaDumbbell />
              </span>
              <span className="fitai-ref-logo-word">FITAI</span>
            </button>
            <p className="ft-desc">
              The intelligent training platform for gym athletes and home workout users. Track, adapt, perform, and stay
              consistent.
            </p>
          </div>
          <div className="ft-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/workout">Workout</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="/progress">Progress</a></li>
              <li><a href="/diet">Diet</a></li>
              <li><a href="/notifications">Reminders</a></li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#footer">About</a></li>
              <li><a href="/login">Sign In</a></li>
              <li><a href="/signup">Start Free</a></li>
              <li><a href="#reviews">Reviews</a></li>
            </ul>
          </div>
        </div>

        <div className="ft-btm">
          <span>© 2026 FitAI Technologies. All rights reserved.</span>
          <span>Designed for athletes. Built for consistency.</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
