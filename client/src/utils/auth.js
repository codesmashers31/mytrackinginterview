export const getToken = () => localStorage.getItem('adminToken');

export const isAuthenticated = () => Boolean(getToken());

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};
