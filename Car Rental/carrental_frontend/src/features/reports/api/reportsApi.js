import API from '../../../services/axiosInstance';

export const reportsApi = {
    // Get all reports
    getAllReports: async (filters = {}) => {
        const response = await API.get('/reports', { params: filters });
        return response.data;
    },

    // Get single report by ID
    getReportById: async (id) => {
        const response = await API.get(`/reports/${id}`);
        return response.data;
    },

    // Create new report
    createReport: async (reportData) => {
        const response = await API.post('/reports', reportData);
        return response.data;
    },

    // Update existing report
    updateReport: async (id, reportData) => {
        const response = await API.put(`/reports/${id}`, reportData);
        return response.data;
    },

    // Delete report
    deleteReport: async (id) => {
        const response = await API.delete(`/reports/${id}`);
        return response.data;
    },

    // Get analytics data
    getAnalytics: async (filters = {}) => {
        const response = await API.get('/reports/analytics/summary', { params: filters });
        return response.data;
    },

    // Export report
    exportReport: async (id, format = 'pdf') => {
        const response = await API.get(`/reports/${id}/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    },

    // Generate custom report
    generateCustomReport: async (criteria) => {
        const response = await API.post('/reports/generate', criteria);
        return response.data;
    }
};
