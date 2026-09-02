import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { tokenStorage } from './tokenStorage';

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor 1: Attach Authorization Bearer Token
API.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor 2: Centralized Response & Token Expiry Handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            tokenStorage.clearSession();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;