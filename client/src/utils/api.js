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

import { authHeaders } from './auth';

// Coordinator API helpers
export const createCoordinator = async (data) => {
  const response = await fetch(buildApiUrl('auth/register-coordinator'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create coordinator');
  }
  return await response.json();
};

export const fetchCoordinators = async () => {
  const response = await fetch(buildApiUrl('auth/coordinators'), {
    headers: { ...authHeaders() }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch coordinators');
  }
  return await response.json();
};

// Placement API helpers
export const createPlacement = async (data) => {
  const response = await fetch(buildApiUrl('auth/register-placement'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create placement account');
  }
  return await response.json();
};

export const fetchPlacements = async () => {
  const response = await fetch(buildApiUrl('auth/placements'), {
    headers: { ...authHeaders() }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch placement accounts');
  }
  return await response.json();
};

export const updateUser = async (id, data) => {
  const response = await fetch(buildApiUrl(`auth/users/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update user account');
  }
  return await response.json();
};

export const deleteUser = async (id) => {
  const response = await fetch(buildApiUrl(`auth/users/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete user account');
  }
  return await response.json();
};
