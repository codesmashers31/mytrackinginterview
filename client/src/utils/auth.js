export const getToken = () => localStorage.getItem('authToken');
export const getUserRole = () => localStorage.getItem('userRole');
export const getUserName = () => localStorage.getItem('userName');
export const getUserEmail = () => localStorage.getItem('userEmail');
export const getUserId = () => localStorage.getItem('userId');

export const isAuthenticated = () => Boolean(getToken());

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  window.location.href = '/login';
};
