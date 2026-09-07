import React, { createContext, useContext, useState, useEffect } from 'react';
import tokenStorage from '../services/tokenStorage';
import { loginUser, registerUser } from '../features/auth/api/authApi';

export const AuthContext = createContext(null);

const normalizeRole = (userInfo) => {
  if (!userInfo) return null;
  const rawRole = userInfo.role || userInfo.roles;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;

  return {
    ...userInfo,
    role: String(role || '').toUpperCase().replace('ROLE_', ''),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getToken();
    const storedUser = tokenStorage.getUser();

    if (token && storedUser) {
      const normalizedUser = normalizeRole(storedUser);
      tokenStorage.saveAuthData(token, normalizedUser);
      setUser(normalizedUser);
    } else {
      tokenStorage.removeToken();
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const token = data.token || data.jwt;
    const rawUserInfo = { ...(data.user ? data.user : data) };

    delete rawUserInfo.token;
    delete rawUserInfo.jwt;

    const userInfo = normalizeRole(rawUserInfo);
    const status = String(userInfo.status || 'ACTIVE').toUpperCase();

    if (!token) {
      throw new Error('Login response did not include an authentication token.');
    }

    if (status !== 'ACTIVE') {
      tokenStorage.removeToken();
      setUser(null);
      throw new Error(`Account status is ${status}. Please contact support.`);
    }

    tokenStorage.saveAuthData(token, userInfo);
    setUser(userInfo);
    return { token, user: userInfo };
  };

  const register = async (userData) => registerUser(userData);

  const logout = () => {
    tokenStorage.removeToken();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      const nextUser = normalizeRole({ ...currentUser, ...updates });
      tokenStorage.setUser(nextUser);
      return nextUser;
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
