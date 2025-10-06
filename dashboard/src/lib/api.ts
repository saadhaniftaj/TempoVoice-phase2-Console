// Utility function to make authenticated API calls
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Specific API functions
export const api = {
  // Users
  getUsers: () => apiCall('/api/users'),
  createUser: (data: any) => apiCall('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteUser: (id: string) => apiCall(`/api/users/${id}`, {
    method: 'DELETE',
  }),

  // Agents
  getAgents: () => apiCall('/api/agents'),
  createAgent: (data: any) => apiCall('/api/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAgent: (id: string) => apiCall(`/api/agents/${id}`, {
    method: 'DELETE',
  }),
  startAgent: (id: string) => apiCall(`/api/agents/${id}/start`, {
    method: 'POST',
  }),
  stopAgent: (id: string) => apiCall(`/api/agents/${id}/stop`, {
    method: 'POST',
  }),

  // Phone Numbers
  getPhoneNumbers: () => apiCall('/api/phone-numbers'),
  createPhoneNumber: (data: any) => apiCall('/api/phone-numbers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deletePhoneNumber: (id: string) => apiCall(`/api/phone-numbers/${id}`, {
    method: 'DELETE',
  }),
};
