// config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  get: (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },

  post: (endpoint: string, data?: any) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: (endpoint: string, data?: any) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },
};