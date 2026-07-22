// Trainly Frontend API Client
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;

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

  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || 'Qualcosa è andato storto.'
    );
  }

  return data;
};

const saveAuth = (data)=>{

  localStorage.setItem(
  'access_token',
  data.access_token
  );

  localStorage.setItem(
  'refresh_token',
  data.refresh_token
  );

  localStorage.setItem(
  'trainly_user',
  JSON.stringify(data.user)
  );

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
    if (data.access_token) {
      saveAuth(data);
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
    if (data.access_token) {
      saveAuth(data);
    }
    return data;
  },

  logout() {
    localStorage.clear();
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
