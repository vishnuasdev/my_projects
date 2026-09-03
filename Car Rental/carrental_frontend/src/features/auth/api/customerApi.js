import API from '../../../services/axiosInstance';

const createFormData = (customer, image) => {
    const formData = new FormData();
    formData.append('customer', new Blob([JSON.stringify(customer)], { type: 'application/json' }));
    if (image) formData.append('image', image);
    return formData;
};

const createImageFormData = (image) => {
    const formData = new FormData();
    formData.append('image', image);
    return formData;
};

export const customerApi = {
    create: async (customer, image) => (await API.post('/customers', createFormData(customer, image))).data,
    createJson: async (customer) => (await API.post('/customers/json', customer)).data,
    getAll: async () => (await API.get('/customers')).data,
    getById: async (id) => (await API.get(`/customers/${id}`)).data,
    getByUserId: async (userId) => (await API.get(`/customers/user/${userId}`)).data,
    getImageUrl: (id) => `${API.defaults.baseURL}/customers/${id}/image`,
    update: async (id, customer, image) => (await API.put(`/customers/${id}`, createFormData(customer, image))).data,
    patch: async (id, customer) => (await API.patch(`/customers/${id}`, customer)).data,
    updateImage: async (id, image) => (await API.patch(`/customers/${id}/image`, createImageFormData(image))).data,
    removeImage: async (id) => (await API.delete(`/customers/${id}/image`)).data,
    remove: async (id) => (await API.delete(`/customers/${id}`)).data,
    updateAsAdmin: async (id, customer) => (await API.put(`/customers/admin/${id}`, customer)).data,
    removeAsAdmin: async (id) => (await API.delete(`/customers/admin/${id}`)).data,
    requestBooking: async (carId, booking) => (await API.post(`/customers/request/${carId}`, booking)).data,
    getMyBookings: async () => (await API.get('/customers/my-bookings')).data,
};