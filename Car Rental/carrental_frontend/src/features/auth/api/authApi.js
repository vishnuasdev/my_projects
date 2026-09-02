import API from '../../../services/axiosInstance';

export const authApi = {
    login: async (credentials) => {
        const response = await API.post('/api/auth/login', credentials);
        return response.data; // Expects { token, user } or JWT string payload
    },

    register: async (userData) => {
        const response = await API.post('/api/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await API.get('/api/auth/me');
        return response.data;
    },
};