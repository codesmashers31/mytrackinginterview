export const getToken = () => localStorage.getItem('authToken');
export const getUserRole = () => localStorage.getItem('userRole');
export const getUserName = () => localStorage.getItem('userName');
export const getUserEmail = () => localStorage.getItem('userEmail');

export const isAuthenticated = () => Boolean(getToken());

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  window.location.href = '/login';
};
