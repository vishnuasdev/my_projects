import { STORAGE_KEYS } from '../config/constants';

export const tokenStorage = {
    getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
    setToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),

    getUser: () => {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    },
    setUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),

    clearSession: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    },
};