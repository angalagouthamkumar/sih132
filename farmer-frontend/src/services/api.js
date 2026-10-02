import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize timeout, network, and database availability errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = 'Server request timed out. The server or database may be waking up; please retry in a moment.';
    } else if (error.response?.status === 503) {
      error.message = error.response.data?.message || 'Database is connecting or temporarily unavailable. Please retry.';
    } else if (!error.response && error.request) {
      error.message = 'Unable to reach the server. Please check your network or server connection.';
    }
    return Promise.reject(error);
  }
);

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Auth API methods
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData, {
    timeout: 0, // No fixed timeout on registration to allow server wake-up
  });
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials, {
    timeout: 0, // No fixed timeout on login to prevent premature abort
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Crop API methods (Module 4)
export const createCrop = async (cropData) => {
  const response = await api.post('/crops', cropData);
  return response.data;
};

export const getMyCrops = async (statusFilter) => {
  const params = {};
  if (statusFilter && statusFilter !== 'all') {
    params.status = statusFilter;
  }
  const response = await api.get('/crops/mine', { params });
  return response.data;
};

export const getCrops = async (filters = {}) => {
  const response = await api.get('/crops', { params: filters });
  return response.data;
};

export const getCropById = async (id) => {
  const response = await api.get(`/crops/${id}`);
  return response.data;
};

export const updateCrop = async (id, updateData) => {
  const response = await api.patch(`/crops/${id}`, updateData);
  return response.data;
};

export const deleteCrop = async (id) => {
  const response = await api.delete(`/crops/${id}`);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.patch('/users/profile', profileData);
  return response.data;
};

export default api;
