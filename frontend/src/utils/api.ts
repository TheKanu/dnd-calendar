import apiConfig from '../config/environment';

// Get auth headers with stored token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Authenticated fetch wrapper
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  // If unauthorized, remove token and reload
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('auth-token');
    window.location.reload();
    return response;
  }

  return response;
};

// API endpoints
export const API = {
  calendar: {
    getConfig: () => authFetch(`${apiConfig.API_BASE_URL}/api/calendar/config`)
  },
  events: {
    getForMonth: (sessionId: string, year: number, month: number) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/events/${sessionId}/${year}/${month}`),
    create: (eventData: any) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/events`, {
        method: 'POST',
        body: JSON.stringify(eventData)
      }),
    delete: (eventId: number, sessionId: string) =>
      authFetch(`${apiConfig.API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        body: JSON.stringify({ sessionId })
      }),
    updateConfirmation: (eventId: number, sessionId: string, confirmed: boolean) =>
      authFetch(`${apiConfig.API_BASE_URL}/api/events/${eventId}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({ sessionId, confirmed })
      }),
    move: (eventId: number, sessionId: string, year: number, month: number, day: number) =>
      authFetch(`${apiConfig.API_BASE_URL}/api/events/${eventId}/move`, {
        method: 'PUT',
        body: JSON.stringify({ sessionId, year, month, day })
      })
  },
  sessions: {
    getAll: () =>
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions`),
    get: (sessionId: string) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}`),
    exists: (sessionId: string) => 
      fetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/exists`),
    create: (sessionData: any) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData)
      }),
    delete: (sessionId: string, password: string) =>
      fetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
  },
  groups: {
    getForSession: (sessionId: string) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/groups`),
    create: (sessionId: string, groupData: any) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/groups`, {
        method: 'POST',
        body: JSON.stringify(groupData)
      }),
    updatePosition: (groupId: number, positionData: any) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/groups/${groupId}/position`, {
        method: 'PUT',
        body: JSON.stringify(positionData)
      }),
    delete: (groupId: number, sessionId: string) =>
      authFetch(`${apiConfig.API_BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE',
        body: JSON.stringify({ sessionId })
      })
  },
  completed: {
    getForMonth: (sessionId: string, year: number, month: number) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/completed/${year}/${month}`),
    getAll: (sessionId: string) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/completed`),
    markDay: (sessionId: string, dayData: any) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/completed`, {
        method: 'POST',
        body: JSON.stringify(dayData)
      }),
    unmarkDay: (sessionId: string, year: number, month: number, day: number) => 
      authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/completed/${year}/${month}/${day}`, {
        method: 'DELETE'
      })
  },
  search: {
    query: (sessionId: string, query: string, filters?: { year?: number; month?: number }) => {
      const params = new URLSearchParams({ q: query });
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.month) params.append('month', filters.month.toString());
      return authFetch(`${apiConfig.API_BASE_URL}/api/sessions/${sessionId}/search?${params}`);
    }
  }
};