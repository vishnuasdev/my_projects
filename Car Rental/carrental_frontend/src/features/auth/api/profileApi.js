import axiosInstance from '../../../services/axiosInstance';

const getEndpoint = (role) => {
    const cleanRole = role.toLowerCase().replace('role_', '');
    if (!['owner', 'agency'].includes(cleanRole)) {
        throw new Error(`Profile endpoint is not available for role: ${cleanRole || 'unknown'}`);
    }
    return `/${cleanRole}/profile`;
};

export const fetchProfileByRole = async (role) => {
    const response = await axiosInstance.get(getEndpoint(role));
    return response.data;
};

export const updateProfileByRole = async (role, profileData, image) => {
    const cleanRole = String(role || '').toUpperCase().replace('ROLE_', '');
    const requestData = cleanRole === 'CUSTOMER'
        ? createProfileFormData('customer', profileData, image)
        : ['OWNER', 'AGENCY'].includes(cleanRole)
            ? createProfileFormData(cleanRole === 'AGENCY' ? 'agency' : 'owner', profileData, image)
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