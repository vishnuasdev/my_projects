import { STORAGE_KEYS } from '../config/constants';

const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const USER_KEY = STORAGE_KEYS.USER;
const ACCOUNTS_KEY = STORAGE_KEYS.ACCOUNTS;
const ACTIVE_ACCOUNT_KEY = STORAGE_KEYS.ACTIVE_ACCOUNT;
const LEGACY_TOKEN_KEY = 'jwt_token';
const LEGACY_USER_KEY = 'user_info';
const authStorage = typeof window === 'undefined' ? null : window.sessionStorage;
const fallbackStorage = typeof window === 'undefined' ? null : window.localStorage;

const readAccounts = () => {
  try {
    const raw = authStorage?.getItem(ACCOUNTS_KEY);
    const accounts = raw ? JSON.parse(raw) : {};
    return accounts && typeof accounts === 'object' && !Array.isArray(accounts) ? accounts : {};
  } catch (error) {
    console.error('Error parsing stored account sessions:', error);
    authStorage?.removeItem(ACCOUNTS_KEY);
    return {};
  }
};

const writeAccounts = (accounts) => {
  authStorage?.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const accountKey = (user) => String(user?.email || user?.id || '').trim().toLowerCase();

const migrateLegacySession = () => {
  const token = authStorage?.getItem(TOKEN_KEY);
  const user = authStorage?.getItem(USER_KEY);
  if (!token || !user) return;
  try {
    const parsedUser = JSON.parse(user);
    const key = accountKey(parsedUser);
    if (!key) return;
    const accounts = readAccounts();
    accounts[key] = { token: token.trim().replace(/^Bearer\s+/i, ''), user: parsedUser };
    writeAccounts(accounts);
    authStorage?.setItem(ACTIVE_ACCOUNT_KEY, key);
  } catch (error) {
    console.error('Error migrating the active account session:', error);
  }
};

const getActiveKey = () => {
  migrateLegacySession();
  const accounts = readAccounts();
  const storedKey = authStorage?.getItem(ACTIVE_ACCOUNT_KEY);
  return storedKey && accounts[storedKey] ? storedKey : Object.keys(accounts)[0] || null;
};

export const saveAuthData = (token, user) => {
  const key = accountKey(user);
  if (!token || !key) throw new Error('An account email and authentication token are required.');
  const accounts = readAccounts();
  accounts[key] = { token: token.trim().replace(/^Bearer\s+/i, ''), user };
  writeAccounts(accounts);
  authStorage?.setItem(ACTIVE_ACCOUNT_KEY, key);
  authStorage?.removeItem(TOKEN_KEY);
  authStorage?.removeItem(USER_KEY);
  fallbackStorage?.removeItem(TOKEN_KEY);
  fallbackStorage?.removeItem(USER_KEY);
};

export const setToken = (token) => {
  const key = getActiveKey();
  if (!token || !key) return;
  const accounts = readAccounts();
  accounts[key] = { ...accounts[key], token: token.trim().replace(/^Bearer\s+/i, '') };
  writeAccounts(accounts);
};

export const setUser = (user) => {
  const key = accountKey(user) || getActiveKey();
  if (!user || !key) return;
  const accounts = readAccounts();
  accounts[key] = { ...accounts[key], user };
  writeAccounts(accounts);
};

export const getToken = () => {
  const active = readAccounts()[getActiveKey()];
  const storedToken = active?.token
    || authStorage?.getItem(LEGACY_TOKEN_KEY)
    || fallbackStorage?.getItem(LEGACY_TOKEN_KEY);
  if (!storedToken) return null;

  // Storage contains the raw JWT; tolerate older sessions that persisted the full header value.
  return storedToken.trim().replace(/^Bearer\s+/i, '');
};

export const getUser = () => {
  const activeUser = readAccounts()[getActiveKey()]?.user;
  if (activeUser) return activeUser;
  const user = authStorage?.getItem(USER_KEY)
    || authStorage?.getItem(LEGACY_USER_KEY)
    || fallbackStorage?.getItem(LEGACY_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error('Error parsing user_info from localStorage:', error);
    authStorage?.removeItem(USER_KEY);
    authStorage?.removeItem(LEGACY_USER_KEY);
    fallbackStorage?.removeItem(LEGACY_USER_KEY);
    return null;
  }
};

export const getAccounts = () => Object.entries(readAccounts()).map(([key, value]) => ({
  key,
  ...(value.user || {}),
}));

export const switchAccount = (key) => {
  const accounts = readAccounts();
  if (!accounts[key]) return false;
  authStorage?.setItem(ACTIVE_ACCOUNT_KEY, key);
  return true;
};

export const removeToken = () => {
  const accounts = readAccounts();
  const activeKey = getActiveKey();
  if (activeKey) delete accounts[activeKey];
  const remainingKeys = Object.keys(accounts);
  if (remainingKeys.length) {
    writeAccounts(accounts);
    authStorage?.setItem(ACTIVE_ACCOUNT_KEY, remainingKeys[0]);
  } else {
    authStorage?.removeItem(ACCOUNTS_KEY);
    authStorage?.removeItem(ACTIVE_ACCOUNT_KEY);
  }
  authStorage?.removeItem(TOKEN_KEY);
  authStorage?.removeItem(USER_KEY);
  authStorage?.removeItem(LEGACY_TOKEN_KEY);
  authStorage?.removeItem(LEGACY_USER_KEY);
  fallbackStorage?.removeItem(TOKEN_KEY);
  fallbackStorage?.removeItem(USER_KEY);
  fallbackStorage?.removeItem(LEGACY_TOKEN_KEY);
  fallbackStorage?.removeItem(LEGACY_USER_KEY);
};

export const clear = () => removeToken();

// Bundle functions into an object
export const tokenStorage = {
  saveAuthData,
  setToken,
  setUser,
  getToken,
  getUser,
  getAccounts,
  switchAccount,
  removeToken,
  clear,
};

// Export as default for default import support
export default tokenStorage;