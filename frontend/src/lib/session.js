const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getToken = () => (canUseStorage() ? localStorage.getItem('token') : null);

export const hasToken = () => Boolean(getToken());

export const getStoredUser = () => {
  if (!canUseStorage()) {
    return null;
  }

  const value = localStorage.getItem('user');

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  if (!canUseStorage()) {
    return;
  }

  if (token) {
    localStorage.setItem('token', token);
  }
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('fitai-auth-changed'));
};

export const clearSession = () => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('fitai-auth-changed'));
};
