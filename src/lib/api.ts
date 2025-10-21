// Utility function to make authenticated API calls
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Request payload types
export type CreateUserPayload = { email: string; password: string; role: 'ADMIN' | 'DEVELOPER'; tenantId?: string };
export type CreateAgentPayload = {
  name: string;
  knowledgeBase: string;
  prompt: string;
  guardrails: string;
  makeEndpoint: string;
  callPhoneNumber: string;
  transferPhoneNumber: string;
  summaryPhoneNumber: string;
  twilioAccountSid: string;
  twilioApiSecret: string;
  voiceId: string;
};
export type CreatePhoneNumberPayload = { number: string; description?: string };

// Specific API functions
export const api = {
  // Users
  getUsers: () => apiCall('/api/users'),
  createUser: (data: CreateUserPayload) => apiCall('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteUser: (id: string) => apiCall(`/api/users/${id}`, {
    method: 'DELETE',
  }),

  // Agents
  getAgents: () => apiCall('/api/agents'),
  createAgent: (data: CreateAgentPayload) => apiCall('/api/agents', {
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
  createPhoneNumber: (data: CreatePhoneNumberPayload) => apiCall('/api/phone-numbers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deletePhoneNumber: (id: string) => apiCall(`/api/phone-numbers/${id}`, {
    method: 'DELETE',
  }),
};
