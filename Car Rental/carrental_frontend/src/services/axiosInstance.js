import axios from 'axios';
import { getToken } from './tokenStorage';

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
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event('backend:online'));
    return response;
  },
  (error) => {
    // A failed dashboard request must not destroy an otherwise valid local session.
    if (!error.response || error.response.status >= 500) {
      window.dispatchEvent(new Event('backend:offline'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
