// config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error ${response.status}:`, errorText);
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
};

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data?: unknown) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data?: unknown) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse(response);
  },
};