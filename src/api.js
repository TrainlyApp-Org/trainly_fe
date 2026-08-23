// Trainly Frontend API Client
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;

let refreshPromise = null;

const getHeaders = () => {

    const token =
        localStorage.getItem('access_token');


    const headers = {
        'Content-Type':'application/json',
    };


    if(token){

        headers['Authorization'] =
            `Bearer ${token}`;

    }


    return headers;
};

const handleResponse = async (response) => {

  const text = await response.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || 'Qualcosa è andato storto.'
    );
  }

  return data;
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('trainly_user');
  localStorage.removeItem('full_name');

  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Refresh token unavailable');

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Session expired');
    }

    const session = await response.json();
    saveAuth(session);
    return session.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const authenticatedFetch = async (url, options = {}) => {
  const execute = () => fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  let response = await execute();
  if (response.status !== 401) return response;

  try {
    await refreshAccessToken();
  } catch {
    clearAuthAndRedirect();
    throw new Error('Sessione scaduta. Effettua nuovamente l’accesso.');
  }

  response = await execute();
  if (response.status === 401) {
    clearAuthAndRedirect();
    throw new Error('Sessione non valida. Effettua nuovamente l’accesso.');
  }

  return response;
};

const saveAuth = (data)=>{

  localStorage.setItem(
  'access_token',
  data.access_token
  );

  if (data.refresh_token) {
    localStorage.setItem(
    'refresh_token',
    data.refresh_token
    );
  }

  if (data.user) {
    localStorage.setItem(
    'trainly_user',
    JSON.stringify(data.user)
    );
  }

};

export const api = {
  async checkHealth() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_BASE_URL}/health/live`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Backend unavailable (${response.status})`);
      }
      return true;
    } finally {
      window.clearTimeout(timeout);
    }
  },

  // Auth & Profile
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.access_token) {
      saveAuth(data);
    }
    return data;
  },

  async register(email, password, username, fullName, adultConfirmed, termsAccepted, privacyAcknowledged) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, fullName, adultConfirmed, termsAccepted, privacyAcknowledged }),
    });
    const data = await handleResponse(res);
    if (data.access_token) {
      saveAuth(data);
    }
    return data;
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async resetPassword(accessToken, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, newPassword }),
    });
    return handleResponse(res);
  },

  logout() {
    localStorage.clear();
  },

  async getProfile() {
    const res = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await authenticatedFetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  async changePassword(currentPassword, newPassword) {
    const res = await authenticatedFetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  async getBillingStatus() {
    const res = await authenticatedFetch(`${API_BASE_URL}/billing/status`);
    return handleResponse(res);
  },

  async createBillingCheckout() {
    const res = await authenticatedFetch(`${API_BASE_URL}/billing/checkout`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async createBillingPortal() {
    const res = await authenticatedFetch(`${API_BASE_URL}/billing/portal`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getAdminStatus() {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/status`);
    return handleResponse(res);
  },

  async getAdminAccounts(page = 0, size = 20, query = '') {
    const params = new URLSearchParams({ page, size, query });
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts?${params}`);
    return handleResponse(res);
  },

  async getAdminAccount(profileId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts/${profileId}`);
    return handleResponse(res);
  },

  async getAdminAccountWorkouts(profileId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts/${profileId}/workouts`);
    return handleResponse(res);
  },

  async updateAdminAccountPremium(profileId, premium) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts/${profileId}/premium`, {
      method: 'PATCH',
      body: JSON.stringify({ premium }),
    });
    return handleResponse(res);
  },

  async cancelAdminAccountSubscription(profileId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts/${profileId}/subscription/cancel`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async resetAdminAccountPassword(profileId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/accounts/${profileId}/password/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Exercises
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/exercises/categories`, {
    });
    return handleResponse(res);
  },

  async getExercises() {
    const res = await authenticatedFetch(`${API_BASE_URL}/exercises`);
    return handleResponse(res);
  },

  async createCustomExercise(name, categoryId, description) {
    const res = await authenticatedFetch(`${API_BASE_URL}/exercises`, {
      method: 'POST',
      body: JSON.stringify({ name, categoryId, description }),
    });
    return handleResponse(res);
  },

  // Workout Routines (Schede)
  async getWorkouts() {
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts`);
    return handleResponse(res);
  },

  async getWorkoutDetails(id, dayId) {
    const query = dayId ? `?dayId=${encodeURIComponent(dayId)}` : '';
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts/${id}${query}`);
    return handleResponse(res);
  },

  async createWorkout(name, description, days) {
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts`, {
      method: 'POST',
      body: JSON.stringify({ name, description, days }),
    });
    return handleResponse(res);
  },

  async updateWorkout(id, name, description, days) {
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, days }),
    });
    return handleResponse(res);
  },

  async deleteWorkout(id) {
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async createShareLink(id) {
    const res = await authenticatedFetch(`${API_BASE_URL}/workouts/${id}/share`, { method: 'POST' });
    return handleResponse(res);
  },

  async getSharedWorkout(shareId) {
    const res = await fetch(`${API_BASE_URL}/workouts/public/${encodeURIComponent(shareId)}`);
    return handleResponse(res);
  },

  async saveSharedWorkoutSet(shareId, dayId, exerciseId, setIndex, weight, reps) {
    const res = await fetch(`${API_BASE_URL}/workouts/public/${encodeURIComponent(shareId)}/weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayId, exerciseId, setIndex, weight, reps }),
    });
    return handleResponse(res);
  },

  async getSharedWorkoutSetValues(shareId, dayId) {
    const query = `?dayId=${encodeURIComponent(dayId)}`;
    const res = await fetch(`${API_BASE_URL}/workouts/public/${encodeURIComponent(shareId)}/values${query}`);
    return handleResponse(res);
  },

  async getWorkoutSetValues(workoutPlanId, workoutDayId) {
    const query = `?workoutPlanId=${encodeURIComponent(workoutPlanId)}&workoutDayId=${encodeURIComponent(workoutDayId)}`;
    const res = await authenticatedFetch(`${API_BASE_URL}/workout-set-values${query}`);
    return handleResponse(res);
  },

  async saveWorkoutSetValue(workoutPlanId, workoutDayId, exerciseId, setIndex, weight, reps) {
    const res = await authenticatedFetch(`${API_BASE_URL}/workout-set-values`, {
      method: 'PUT',
      body: JSON.stringify({ workoutPlanId, workoutDayId, exerciseId, setIndex, weight, reps }),
    });
    return handleResponse(res);
  },

  // Workout Session Logging
  async startWorkoutLog(workoutPlanId, workoutDayId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/start`, {
      method: 'POST',
      body: JSON.stringify({ workoutPlanId, workoutDayId }),
    });
    return handleResponse(res);
  },

  async getActiveWorkout(workoutPlanId, workoutDayId) {
    const query = `?workoutPlanId=${encodeURIComponent(workoutPlanId)}&workoutDayId=${encodeURIComponent(workoutDayId)}`;
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/active${query}`);
    return handleResponse(res);
  },

  async logWorkoutSet(workoutLogId, exerciseId, setIndex, reps, weight, completed) {
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/set`, {
      method: 'POST',
      body: JSON.stringify({ workoutLogId, exerciseId, setIndex, reps, weight, completed }),
    });
    return handleResponse(res);
  },

  async completeWorkoutLog(workoutLogId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/complete`, {
      method: 'POST',
      body: JSON.stringify({ workoutLogId }),
    });
    return handleResponse(res);
  },

  async getWorkoutHistory() {
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/history`);
    return handleResponse(res);
  },

  async getWorkoutHistoryDetails(id) {
    const res = await authenticatedFetch(`${API_BASE_URL}/logs/history/${id}`);
    return handleResponse(res);
  }
};
