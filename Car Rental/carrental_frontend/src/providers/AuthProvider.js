import React, { createContext, useState, useEffect } from 'react';

// Relative path to tokenStorage (located in src/services/)
import tokenStorage from '../services/tokenStorage'; 

// Relative path to auth API functions (located in src/features/auth/api/authApi or services/)
import { loginUser, registerUser } from '../features/auth/api/authApi'; 

export const AuthContext = createContext(null);

const normalizeRole = (userInfo) => {
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

  // 1. Re-hydrate auth state on initial app load
  useEffect(() => {
    const initializeAuth = () => {
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
    };

    initializeAuth();
  }, []);

  // 2. Login function
  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const { token, ...rawUserInfo } = data;
    const userInfo = normalizeRole(rawUserInfo);

    const status = String(userInfo.status || '').toUpperCase();

    if (token && status === 'ACTIVE') {
      tokenStorage.saveAuthData(token, userInfo);
      setUser(userInfo);
    } else if (status && status !== 'ACTIVE') {
      tokenStorage.removeToken();
      setUser(null);
    }

    return { ...data, ...userInfo };
  };

  // 3. Register function
  const register = async (userData) => {
    return await registerUser(userData);
  };

  // 4. Logout function
  const logout = () => {
    tokenStorage.removeToken();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};