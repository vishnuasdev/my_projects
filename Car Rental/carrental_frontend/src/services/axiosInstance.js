import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';

let backendOffline = false;

export const isBackendOffline = () => backendOffline;

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    backendOffline = false;
    window.dispatchEvent(new Event('backend:online'));
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.dispatchEvent(new Event('auth:expired'));
    }

    if (!error.response || error.response.status >= 500) {
      backendOffline = true;
      window.dispatchEvent(new Event('backend:offline'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;