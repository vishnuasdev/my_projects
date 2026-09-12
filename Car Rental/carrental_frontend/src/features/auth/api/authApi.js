import axiosInstance from '../../../services/axiosInstance';

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data; // Returns { token, email, role, status }
};

export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.patch('/auth/password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};