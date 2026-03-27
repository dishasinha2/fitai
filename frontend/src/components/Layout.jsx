import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../lib/session';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workout', label: 'Workout' },
  { to: '/progress', label: 'Progress' },
  { to: '/diet', label: 'Diet' },
];

function Layout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="fitai-shell fitai-grid">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-card glass-morphism mb-6 rounded-3xl px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/dashboard" className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                FitAI
              </Link>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">{subtitle}</p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm transition ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Profile</p>
                  <p className="text-sm font-medium text-white">{user?.name || 'FitAI User'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export default Layout;
