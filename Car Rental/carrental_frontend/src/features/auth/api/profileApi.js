import API from '../../../services/axiosInstance';

const normalizeRole = (role) => String(role || '').toLowerCase().replace('role_', '');

const createProfileFormData = (partName, profileData, image) => {
    const formData = new FormData();
    formData.append(partName, new Blob([JSON.stringify(profileData)], { type: 'application/json' }));
    if (image) formData.append('image', image);
    return formData;
};

const getProfileId = (user) => user?.profileId || user?.customerId || user?.id;

export const fetchProfileByRole = async (role, user) => {
    const cleanRole = normalizeRole(role);

    if (cleanRole === 'customer') {
        const userId = getProfileId(user);
        if (!userId) {
            throw new Error('Customer profile ID is missing from the login response.');
        }
        return (await API.get(`/customers/user/${userId}`)).data;
    }

    if (cleanRole === 'owner' || cleanRole === 'agency') {
        return (await API.get(`/${cleanRole}/profile`)).data;
    }

    throw new Error(`Profile endpoint is not available for role: ${cleanRole || 'unknown'}`);
};

export const updateProfileByRole = async (role, profileData, user, image) => {
    const cleanRole = normalizeRole(role);

    if (cleanRole === 'customer') {
        const profileId = profileData.id || user?.profileId || user?.customerId;
        if (!profileId) {
            throw new Error('Customer profile ID is missing from the login response.');
        }
        const customerPayload = {
            ...profileData,
            name: profileData.name,
            phone: profileData.phone,
        };
        if (!image) {
            return (await API.patch(`/customers/${profileId}`, customerPayload)).data;
        }
        return (await API.put(`/customers/${profileId}`, createProfileFormData('customer', customerPayload, image))).data;
    }

    if (cleanRole === 'owner' || cleanRole === 'agency') {
        return (await API.put(`/${cleanRole}/profile`, createProfileFormData(cleanRole, profileData, image))).data;
    }

    throw new Error(`Profile endpoint is not available for role: ${cleanRole || 'unknown'}`);
};
