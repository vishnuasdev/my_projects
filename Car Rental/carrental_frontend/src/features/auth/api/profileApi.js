import axiosInstance from '../../../services/axiosInstance';

const getEndpoint = (role) => {
    if (!role) return '/api/users/profile';
    const cleanRole = role.toLowerCase().replace('role_', '');
    return `/api/${cleanRole}/profile`;
};

export const fetchProfileByRole = async (role) => {
    const response = await axiosInstance.get(getEndpoint(role));
    return response.data;
};

export const updateProfileByRole = async (role, profileData, image) => {
    const cleanRole = String(role || '').toUpperCase().replace('ROLE_', '');
    const requestData = cleanRole === 'CUSTOMER'
        ? createProfileFormData('customer', profileData, image)
        : cleanRole === 'OWNER'
            ? createProfileFormData('owner', profileData, image)
            : profileData;
    const response = await axiosInstance.put(getEndpoint(role), requestData);
    return response.data;
};

const createProfileFormData = (partName, profileData, image) => {
    const formData = new FormData();
    formData.append(partName, new Blob([JSON.stringify(profileData)], { type: 'application/json' }));
    if (image) formData.append('image', image);
    return formData;
};