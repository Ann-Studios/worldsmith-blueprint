const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`).then(handleResponse),
  
  post: (endpoint: string, data: any) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
    
  put: (endpoint: string, data: any) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
    
  delete: (endpoint: string) =>
    fetch(`${API_BASE_URL}${endpoint}`, { 
      method: 'DELETE' 
    }).then(handleResponse)
};