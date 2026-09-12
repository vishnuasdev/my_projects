import API from '../../../services/axiosInstance';

const createFormData = (partName, data, image) => {
    const formData = new FormData();
    formData.append(partName, new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (image) formData.append('image', image);
    return formData;
};

const createImageFormData = (image) => {
    const formData = new FormData();
    formData.append('image', image);
    return formData;
};

const createCarFormData = (car, images = []) => {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(car)], { type: 'application/json' }));
    images.forEach((image) => formData.append('images', image));
    return formData;
};

export const agencyApi = {
    create: async (agency, image) => (await API.post('/agency', createFormData('agency', agency, image))).data,
    getById: async (id) => (await API.get(`/agency/${id}`)).data,
    getImageUrl: (id) => `${API.defaults.baseURL}/agency/${id}/image`,
    update: async (id, agency, image) => (await API.put(`/agency/${id}`, createFormData('agency', agency, image))).data,
    patch: async (id, agency) => (await API.patch(`/agency/${id}`, agency)).data,
    updateImage: async (id, image) => (await API.patch(`/agency/${id}/image`, createImageFormData(image))).data,
    remove: async (id) => (await API.delete(`/agency/${id}`)).data,
    getCars: async () => (await API.get('/agency/cars')).data,
    updateCar: async (id, car, images = []) => (await API.put(`/agency/cars/${id}`, createCarFormData(car, images))).data,
    setCarAvailability: async (carId, available) => (await API.patch(`/agency/cars/${carId}/availability`, null, { params: { available } })).data,
    getAcceptedBids: async () => (await API.get('/agency/bids/accepted')).data,
    getBids: async () => (await API.get('/agency/bids')).data,
    getBookings: async () => (await API.get('/agency/bookings')).data,
    updateBookingStatus: async (bookingId, status) => (await API.patch(`/agency/bookings/${bookingId}/status`, null, { params: { status } })).data,
    getBookingsForCars: async () => (await API.get('/agency/agency-cars')).data,
    updateBidStatus: async (id, status) => (await API.patch(`/agency/bids/${id}/status`, null, { params: { status } })).data,
    getBidsByAgency: async (agencyId) => (await API.get(`/agency/agency/${agencyId}`)).data,
};