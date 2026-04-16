import { Link, NavLink, useNavigate } from 'react-router-dom';
import AppFooter from './AppFooter';
import api from '../lib/api';
import { clearSession, getStoredUser } from '../lib/session';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workout', label: 'Workout' },
  { to: '/progress', label: 'Progress' },
  { to: '/diet', label: 'Diet' },
  { to: '/notifications', label: 'Reminders' },
  { to: '/settings', label: 'Settings' },
];

const adminNavItems = [
  { to: '/admin', label: 'Admin' },
  { to: '/requests', label: 'Requests' },
  { to: '/analytics', label: 'Analytics' },
];

function Layout({ title, subtitle, heroImage, heroLabel, children }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const visibleNavItems = user?.role === 'admin' ? [...navItems, ...adminNavItems] : navItems;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Clear local session even if logout endpoint is temporarily unavailable.
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <div className="fitai-ref-app-shell fitai-ref-app-grid">
      <div className="min-h-screen">
        <header className="fitai-ref-app-header fitai-ref-app-header-shell px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/dashboard" className="fitai-ref-kicker">
                FitAI
              </Link>
              <h1 className="fitai-ref-app-title mt-3">{title}</h1>
              <p className="fitai-ref-copy mt-2 max-w-2xl text-sm sm:text-base">{subtitle}</p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap gap-2">
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-4 py-2 text-sm ${
                        isActive
                          ? 'fitai-ref-action text-white'
                          : 'fitai-ref-action-secondary text-slate-200'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="fitai-ref-profile-box text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Profile</p>
                  <p className="text-sm font-medium text-white">
                    {user?.name || 'FitAI User'}
                    {user?.role === 'admin' ? ' | Admin' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="fitai-ref-action-secondary px-4 py-2 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <section
          className="fitai-ref-page-hero"
          style={
            heroImage
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(11,12,14,0.34), rgba(11,12,14,0.82)), url('${heroImage}')`,
                }
              : undefined
          }
        >
          <div className="fitai-ref-page-hero-inner px-4 sm:px-6 lg:px-8">
            {heroLabel ? <p className="fitai-ref-kicker">{heroLabel}</p> : null}
            <h2 className="fitai-ref-page-hero-title mt-4">{title}</h2>
            <p className="fitai-ref-copy mt-4 max-w-3xl text-base sm:text-lg">{subtitle}</p>
          </div>
        </section>

        <main className="fitai-ref-page-content px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

export default Layout;
