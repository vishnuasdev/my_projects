export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
    ? (process.env.REACT_APP_API_BASE_URL.replace(/\/?$/, '') + '/')
    : 'http://localhost:8080/';

export const STORAGE_KEYS = {
    TOKEN: 'carrental_jwt_token',
    USER: 'carrental_user_info',
    ACCOUNTS: 'carrental_auth_accounts',
    ACTIVE_ACCOUNT: 'carrental_active_account',
};

export const ROLES = {
    CUSTOMER: 'CUSTOMER',
    AGENCY: 'AGENCY',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
};

export const BOOKING_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
};