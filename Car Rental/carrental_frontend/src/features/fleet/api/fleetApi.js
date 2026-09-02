import API from '../../../services/axiosInstance';

export const fleetApi = {
    getAvailableVehicles: async () => {
        const response = await API.get('/api/cars/available');
        return response.data;
    },

    getVehicleById: async (id) => {
        const response = await API.get(`/api/cars/${id}`);
        return response.data;
    },

    getMyVehicles: async () => {
        const response = await API.get('/api/owner/cars');
        return response.data;
    },

    getVehiclesByAgency: async (agencyId) => {
        const response = await API.get(`/api/cars/agency/${agencyId}`);
        return response.data;
    },

    getVehiclesByOwner: async (ownerId) => {
        const response = await API.get(`/api/cars/owner/${ownerId}`);
        return response.data;
    },

    createVehicle: async (vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.post('/api/owner/cars', formData);
        return response.data;
    },

    updateVehicle: async (id, vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.put(`/api/owner/cars/${id}`, formData);
        return response.data;
    },

    toggleAvailability: async (id, isAvailable) => {
        const response = await API.patch(`/api/owner/cars/${id}/availability`, null, { params: { isAvailable } });
        return response.data;
    },

    deleteVehicle: async (id) => {
        const response = await API.delete(`/api/owner/cars/${id}`);
        return response.data;
    },

    updateVehicleAsAdmin: async (id, vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.put(`/api/cars/${id}`, formData);
        return response.data;
    },

    toggleAvailabilityAsAdmin: async (id, isAvailable) => {
        const response = await API.patch(`/api/cars/${id}/availability`, null, { params: { isAvailable } });
        return response.data;
    },

    deleteVehicleAsAdmin: async (id) => {
        const response = await API.delete(`/api/cars/${id}`);
        return response.data;
    },
};

const createCarFormData = (vehicleData, images) => {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(vehicleData)], { type: 'application/json' }));
    images.forEach((image) => formData.append('images', image));
    return formData;
};