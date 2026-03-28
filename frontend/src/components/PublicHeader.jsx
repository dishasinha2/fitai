import { Link } from 'react-router-dom';
import { hasToken } from '../lib/session';

function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="cult-brand-badge flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold">
          F
        </span>
        <span className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-300">FitAI</span>
      </Link>

      <nav className="flex items-center gap-3">
        <Link to="/" className="cult-button-secondary rounded-full px-4 py-2 text-sm">
          About
        </Link>
        <Link to={hasToken() ? '/dashboard' : '/login'} className="cult-button-primary rounded-full px-5 py-2 text-sm font-semibold">
          {hasToken() ? 'Dashboard' : 'Login'}
        </Link>
      </nav>
    </header>
  );
}

export default PublicHeader;
