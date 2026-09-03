const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_info';

export const saveAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Bundle functions into an object
export const tokenStorage = {
  saveAuthData,
  getToken,
  getUser,
  removeToken,
};

// Export as default for default import support
export default tokenStorage;