import API from '../../../services/axiosInstance';

const createFormData = (owner, image) => {
    const formData = new FormData();
    formData.append('owner', new Blob([JSON.stringify(owner)], { type: 'application/json' }));
    if (image) formData.append('image', image);
    return formData;
};

const createImageFormData = (image) => {
    const formData = new FormData();
    formData.append('image', image);
    return formData;
};

export const ownerApi = {
    create: async (owner, image) => (await API.post('/owner', createFormData(owner, image))).data,
    getAll: async () => (await API.get('/owner')).data,
    getById: async (id) => (await API.get(`/owner/${id}`)).data,
    getImageUrl: (id) => `${API.defaults.baseURL}/owner/${id}/image`,
    getImage: async (id) => (await API.get(`/owner/${id}/image`, { responseType: 'blob' })).data,
    update: async (id, owner, image) => (await API.put(`/owner/${id}`, createFormData(owner, image))).data,
    patch: async (id, owner) => (await API.patch(`/owner/${id}`, owner)).data,
    updateImage: async (id, image) => (await API.patch(`/owner/${id}/image`, createImageFormData(image))).data,
    remove: async (id) => (await API.delete(`/owner/${id}`)).data,
    updateAsAdmin: async (id, owner) => (await API.put(`/owner/admin/${id}`, owner)).data,
    removeAsAdmin: async (id) => (await API.delete(`/owner/admin/${id}`)).data,
    getMyCars: async () => (await API.get('/owner/cars')).data,
    getAgencies: async () => (await API.get('/owner/agencies')).data,
    createCar: async (car, agencyId, images = []) => {
        const formData = new FormData();
        formData.append('car', new Blob([JSON.stringify(car)], { type: 'application/json' }));
        if (agencyId) formData.append('agencyId', agencyId);
        images.forEach((image) => formData.append('images', image));
        return (await API.post('/owner/cars', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    updateCar: async (id, car, images = []) => {
        const formData = new FormData();
        formData.append('car', new Blob([JSON.stringify(car)], { type: 'application/json' }));
        images.forEach((image) => formData.append('images', image));
        return (await API.put(`/owner/cars/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    removeCar: async (id) => (await API.delete(`/owner/cars/${id}`)).data,
    setCarAvailability: async (id, isAvailable) => (await API.patch(`/owner/cars/${id}/availability`, null, { params: { isAvailable } })).data,
    getProfile: async () => (await API.get('/owner/profile')).data,
    updateProfile: async (owner, image) => (await API.put('/owner/profile', createFormData(owner, image))).data,
    getProfileImageUrl: (userId) => `${API.defaults.baseURL}/owner/profile/image/${userId}`,
    placeBid: async (bid) => (await API.post('/owner/bids', bid)).data,
    getMyBids: async () => (await API.get('/owner/bids')).data,
    getBidsByCar: async (carId) => (await API.get(`/owner/cars/${carId}/bids`)).data,
    cancelBid: async (bidId) => (await API.delete(`/owner/bids/${bidId}`)).data,
    recallCar: async (carId) => (await API.put(`/owner/cars/${carId}/recall`)).data,
};