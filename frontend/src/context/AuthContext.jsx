import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getStoredUser, hasToken } from '../lib/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken());
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(hasToken());
      setUser(getStoredUser());
    };

    window.addEventListener('storage', syncAuth);
    window.addEventListener('fitai-auth-changed', syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('fitai-auth-changed', syncAuth);
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      logout: () => {
        clearSession();
      },
    }),
    [isAuthenticated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
