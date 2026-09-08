import API from '../../../services/axiosInstance';

export const adminApi = {
    getSummary: async () => (await API.get('/admin/summary')).data,
    getUsers: async () => (await API.get('/admin/users')).data,
    getUser: async (id) => (await API.get(`/admin/users/${id}`)).data,
    getUserByEmail: async (email) => (await API.get('/admin/users/email', { params: { email } })).data,
    getUsersByRole: async (role) => (await API.get(`/admin/users/role/${role}`)).data,
    getUsersByStatus: async (status) => (await API.get(`/admin/users/status/${status}`)).data,
    registerUser: async (user) => (await API.post('/admin/users/register', user)).data,
    updateUser: async (id, user) => (await API.put(`/admin/users/${id}`, user)).data,
    updateUserStatus: async (id, status) => (await API.patch(`/admin/users/${id}/status`, null, { params: { status } })).data,
    removeUser: async (id) => (await API.delete(`/admin/users/${id}`)).data,
    getAgencies: async (status) => (await API.get('/admin/agencies', { params: status && { status } })).data,
    getAgency: async (id) => (await API.get(`/admin/agencies/${id}`)).data,
    getAgencyByUser: async (userId) => (await API.get(`/admin/agencies/user/${userId}`)).data,
    updateAgency: async (id, agency) => (await API.put(`/admin/agencies/${id}`, agency)).data,
    removeAgency: async (id) => (await API.delete(`/admin/agencies/${id}`)).data,
    getCars: async () => (await API.get('/admin/cars')).data,
    getAvailableCars: async () => (await API.get('/admin/cars/available')).data,
    getCar: async (id) => (await API.get(`/admin/cars/${id}`)).data,
    createCar: async (car, agencyId, images = []) => {
        const formData = new FormData();
        formData.append('car', new Blob([JSON.stringify(car)], { type: 'application/json' }));
        if (agencyId) formData.append('agencyId', agencyId);
        images.forEach((image) => formData.append('images', image));
        return (await API.post('/admin/cars/add', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    removeCar: async (id) => (await API.delete(`/admin/cars/${id}`)).data,
    getBids: async () => (await API.get('/admin/bids')).data,
    getBid: async (id) => (await API.get(`/admin/bids/${id}`)).data,
    getBidsByCar: async (carId) => (await API.get(`/admin/bids/car/${carId}`)).data,
    getBidsByOwner: async (ownerId) => (await API.get(`/admin/bids/owner/${ownerId}`)).data,
    getBidsByAgency: async (agencyId) => (await API.get(`/admin/bids/agency/${agencyId}`)).data,
    placeBid: async (bid) => (await API.post('/admin/place', bid)).data,
    updateBidStatus: async (id, status) => (await API.patch(`/admin/bids/${id}/status`, null, { params: { status } })).data,
    removeBid: async (id) => (await API.delete(`/admin/bids/${id}`)).data,
    getBookings: async () => (await API.get('/admin/bookings')).data,
    getBooking: async (id) => (await API.get(`/admin/bookings/${id}`)).data,
    updateBookingStatus: async (id, status) => (await API.patch(`/admin/bookings/${id}/status`, null, { params: { status } })).data,
    cancelBooking: async (id) => (await API.patch(`/admin/bookings/${id}/cancel`)).data,
};