export const getToken = () => localStorage.getItem('token');

export const hasToken = () => Boolean(getToken());

export const getStoredUser = () => {
  const value = localStorage.getItem('user');
  return value ? JSON.parse(value) : null;
};

export const saveSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('fitai-auth-changed'));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('fitai-auth-changed'));
};
