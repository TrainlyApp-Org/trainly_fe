// Trainly Frontend API Client
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001/api`;

const getHeaders = () => {
  const token = localStorage.getItem('trainly_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Qualcosa è andato storto.');
  }
  return data;
};

export const api = {
  // Auth & Profile
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.session?.access_token) {
      localStorage.setItem('trainly_token', data.session.access_token);
      localStorage.setItem('trainly_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(email, password, username, fullName) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, fullName }),
    });
    const data = await handleResponse(res);
    if (data.session?.access_token) {
      localStorage.setItem('trainly_token', data.session.access_token);
      localStorage.setItem('trainly_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('trainly_token');
    localStorage.removeItem('trainly_user');
  },

  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Exercises
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/exercises/categories`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getExercises() {
    const res = await fetch(`${API_BASE_URL}/exercises`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createCustomExercise(name, categoryId, description) {
    const res = await fetch(`${API_BASE_URL}/exercises`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, categoryId, description }),
    });
    return handleResponse(res);
  },

  // Workout Routines (Schede)
  async getWorkouts() {
    const res = await fetch(`${API_BASE_URL}/workouts`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getWorkoutDetails(id, dayId) {
    const query = dayId ? `?dayId=${encodeURIComponent(dayId)}` : '';
    const res = await fetch(`${API_BASE_URL}/workouts/${id}${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createWorkout(name, description, days) {
    const res = await fetch(`${API_BASE_URL}/workouts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, days }),
    });
    return handleResponse(res);
  },

  async updateWorkout(id, name, description, days) {
    const res = await fetch(`${API_BASE_URL}/workouts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, days }),
    });
    return handleResponse(res);
  },

  async deleteWorkout(id) {
    const res = await fetch(`${API_BASE_URL}/workouts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createShareLink(id) {
    const res = await fetch(`${API_BASE_URL}/workouts/${id}/share`, { method: 'POST', headers: getHeaders() });
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

  // Workout Session Logging
  async startWorkoutLog(workoutPlanId, workoutDayId) {
    const res = await fetch(`${API_BASE_URL}/logs/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ workoutPlanId, workoutDayId }),
    });
    return handleResponse(res);
  },

  async getActiveWorkout(workoutPlanId, workoutDayId) {
    const query = `?workoutPlanId=${encodeURIComponent(workoutPlanId)}&workoutDayId=${encodeURIComponent(workoutDayId)}`;
    const res = await fetch(`${API_BASE_URL}/logs/active${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async logWorkoutSet(workoutLogId, exerciseId, setIndex, reps, weight, completed) {
    const res = await fetch(`${API_BASE_URL}/logs/set`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ workoutLogId, exerciseId, setIndex, reps, weight, completed }),
    });
    return handleResponse(res);
  },

  async completeWorkoutLog(workoutLogId) {
    const res = await fetch(`${API_BASE_URL}/logs/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ workoutLogId }),
    });
    return handleResponse(res);
  },

  async getWorkoutHistory() {
    const res = await fetch(`${API_BASE_URL}/logs/history`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getWorkoutHistoryDetails(id) {
    const res = await fetch(`${API_BASE_URL}/logs/history/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};
