import { Link } from 'react-router-dom';
import { hasToken } from '../lib/session';

function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/" className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
        FitAI
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
        >
          About
        </Link>
        <Link
          to={hasToken() ? '/dashboard' : '/login'}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {hasToken() ? 'Dashboard' : 'Login'}
        </Link>
      </nav>
    </header>
  );
}

export default PublicHeader;
