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

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials, {
    timeout: 0, // No fixed timeout on admin login to allow server wake-up
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default api;
