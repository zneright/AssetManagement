import axios from 'axios';
import { message } from 'antd';

// setup axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// lagay bearer token sa headers kapag naka login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// catch ng network error or expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      message.error('Unable to connect to server. Please check your network.');
    } else if (error.response.status === 401) {
      const hadToken = Boolean(localStorage.getItem('token'));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (hadToken) {
        message.warning('Session expired. Please log in again.');
      }
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
