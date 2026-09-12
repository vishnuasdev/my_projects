import API from '../../../services/axiosInstance';

export const fleetApi = {
    getAvailableVehicles: async () => {
        const response = await API.get('/cars/available');
        return response.data;
    },

    getVehicleById: async (id) => {
        const response = await API.get(`/cars/${id}`);
        return response.data;
    },
    getVehicleImage: async (id, index) => {
        const response = await API.get(`/cars/${id}/image/${index}`, { responseType: 'blob' });
        return response.data;
    },

    getMyVehicles: async () => {
        const response = await API.get('/owner/cars');
        return response.data;
    },

    getVehiclesByAgency: async (agencyId) => {
        const response = await API.get(`/cars/agency/${agencyId}`);
        return response.data;
    },

    getVehiclesByOwner: async (ownerId) => {
        const response = await API.get(`/cars/owner/${ownerId}`);
        return response.data;
    },

    createVehicle: async (vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.post('/owner/cars', formData);
        return response.data;
    },

    updateVehicle: async (id, vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.put(`/owner/cars/${id}`, formData);
        return response.data;
    },
    deleteVehicleImage: async (id, index) => {
        const response = await API.delete(`/owner/cars/${id}/images/${index}`);
        return response.data;
    },

    toggleAvailability: async (id, isAvailable) => {
        const response = await API.patch(`/owner/cars/${id}/availability`, null, { params: { isAvailable } });
        return response.data;
    },
    processBid: async (id, status, remarks) => {
        const response = await API.patch(`/cars/${id}/bid-status`, null, { params: { status, remarks } });
        return response.data;
    },

    deleteVehicle: async (id) => {
        const response = await API.delete(`/owner/cars/${id}`);
        return response.data;
    },

    updateVehicleAsAdmin: async (id, vehicleData, images = []) => {
        const formData = createCarFormData(vehicleData, images);
        const response = await API.put(`/cars/${id}`, formData);
        return response.data;
    },

    toggleAvailabilityAsAdmin: async (id, isAvailable) => {
        const response = await API.patch(`/cars/${id}/availability`, null, { params: { isAvailable } });
        return response.data;
    },

    deleteVehicleAsAdmin: async (id) => {
        const response = await API.delete(`/cars/${id}`);
        return response.data;
    },
};

const createCarFormData = (vehicleData, images) => {
    const formData = new FormData();
    const safeVehicleData = { ...vehicleData };
    delete safeVehicleData.owner;
    delete safeVehicleData.agency;
    delete safeVehicleData.ownerId;
    delete safeVehicleData.agencyId;
    formData.append('car', new Blob([JSON.stringify(safeVehicleData)], { type: 'application/json' }));
    images.forEach((image) => formData.append('images', image));
    return formData;
};