import API from '../../../services/axiosInstance';

const normalizeRole = (role) =>
    String(role || '')
        .toLowerCase()
        .replace('role_', '');

const ROLE_CONFIG = {
    customer: {
        profile: '/customers/profile',
        image: '/customers/profile/image',
    },
    owner: {
        profile: '/owner/profile',
        image: '/owner/profile/image',
    },
    agency: {
        profile: '/agency/profile',
        image: '/agency/profile/image',
    },
};

const getConfig = (role) => {
    const cleanRole = normalizeRole(role);
    const config = ROLE_CONFIG[cleanRole];

    if (!config) {
        throw new Error(`Unsupported profile role: ${cleanRole}`);
    }

    return config;
};

const createProfileFormData = (profileData, image) => {
    const formData = new FormData();

    formData.append(
        'profile',
        new Blob(
            [JSON.stringify(profileData)],
            { type: 'application/json' }
        )
    );

    if (image) {
        formData.append('image', image);
    }

    return formData;
};

export const fetchProfileByRole = async (role) => {
    const config = getConfig(role);

    const response = await API.get(config.profile);

    return response.data;
};

export const updateProfileByRole = async (
    role,
    profileData,
    image = null
) => {
    const config = getConfig(role);

    const formData = createProfileFormData(
        profileData,
        image
    );

    const response = await API.put(
        config.profile,
        formData
    );

    return response.data;
};

export const fetchProfileImageByRole = async (role) => {
    const config = getConfig(role);

    const response = await API.get(
        config.image,
        {
            responseType: 'blob',
        }
    );

    return URL.createObjectURL(response.data);
};

export const deleteProfileImageByRole = async (role) => {
    const config = getConfig(role);

    await API.delete(config.image);
};