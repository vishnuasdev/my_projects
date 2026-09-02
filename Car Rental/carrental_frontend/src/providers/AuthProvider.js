import React, { createContext, useState, useEffect } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { authApi } from '../features/auth/api/authApi';


export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = tokenStorage.getToken();
            const savedUser = tokenStorage.getUser();

            if (savedToken && savedUser) {
                setUser(savedUser);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (credentials) => {
        const data = await authApi.login(credentials);
        const token = data.token || data.jwt;
        const userData = data.user || { email: credentials.email, role: data.role };

        tokenStorage.setToken(token);
        tokenStorage.setUser(userData);
        setUser(userData);
        return userData;
    };

    const register = async (userData) => {
        return await authApi.register(userData);
    };

    const logout = () => {
        tokenStorage.clearSession();
        setUser(null);
        // Redirect to public view after logout
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};