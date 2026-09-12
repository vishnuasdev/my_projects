import axios from 'axios';
import { getToken, removeToken } from './tokenStorage';

let expiryEventDispatched = false;

const isJwtExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch (error) {
    return true;
  }
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 5000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (String(config.url || '').includes('/auth/login')) {
      expiryEventDispatched = false;
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      config.__authToken = token;
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
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register');

    const failedToken = error.config?.__authToken;
    const activeToken = getToken();

    if (error.response?.status === 401) {
      console.error(
        `[auth] 401 from ${error.config?.method?.toUpperCase() || 'REQUEST'} ${requestUrl}; `
        + `token attached: ${Boolean(failedToken)}; current token matches: ${failedToken === activeToken}`
      );
    }

    // Do not let several parallel dashboard requests repeatedly clear the same
    // account, and never let an older request clear a newer login session.
    if (
      error.response?.status === 401
      && !isAuthRequest
      && failedToken
      && activeToken === failedToken
      && isJwtExpired(activeToken)
      && !expiryEventDispatched
    ) {
      expiryEventDispatched = true;
      removeToken();
      window.dispatchEvent(new Event('auth:expired'));
    }

    // A failed dashboard request must not destroy an otherwise valid local session.
    if (!error.response || error.response.status >= 500) {
      window.dispatchEvent(new Event('backend:offline'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
