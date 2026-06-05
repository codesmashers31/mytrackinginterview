export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const localHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

    if (localHosts.includes(hostname) || hostname.endsWith('.localhost')) {
      return '/api';
    }
  }

  return envUrl || '/api';
};

export const buildApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
