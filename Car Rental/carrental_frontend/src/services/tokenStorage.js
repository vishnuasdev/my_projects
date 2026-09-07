import { STORAGE_KEYS } from '../config/constants';

const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const USER_KEY = STORAGE_KEYS.USER;
const LEGACY_TOKEN_KEY = 'jwt_token';
const LEGACY_USER_KEY = 'user_info';

export const saveAuthData = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const setUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error('Error parsing user_info from localStorage:', error);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};

export const clear = () => removeToken();

// Bundle functions into an object
export const tokenStorage = {
  saveAuthData,
  setToken,
  setUser,
  getToken,
  getUser,
  removeToken,
  clear,
};

// Export as default for default import support
export default tokenStorage;