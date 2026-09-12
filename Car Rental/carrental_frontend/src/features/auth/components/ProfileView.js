import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import {
    fetchProfileByRole,
    updateProfileByRole,
    fetchProfileImageByRole,
    deleteProfileImageByRole
} from '../api/profileApi';
import { changePassword } from '../api/authApi';

import Spinner from '../../../components/feedback/Spinner';

const EMPTY_ADDRESS = {
    doorNo: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
};

const EMPTY_FORM = {
    name: '',
    phone: '',
    dob: '',
    licenseNo: '',
    location: '',
    address: { ...EMPTY_ADDRESS }
};

const ProfileView = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingImage, setDeletingImage] = useState(false);

    const [saveError, setSaveError] = useState('');
    const [loadError, setLoadError] = useState('');

    const [dbProfile, setDbProfile] = useState({});
    const [form, setForm] = useState(EMPTY_FORM);

    // Selected new image
    const [profileImage, setProfileImage] = useState(null);

    // Existing image URL from backend
    const [existingImageUrl, setExistingImageUrl] = useState('');

    // New selected image preview
    const [imagePreview, setImagePreview] = useState('');
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const rawRole = user?.role || user?.roles || '';

    const userRoles = Array.isArray(rawRole)
        ? rawRole
        : [rawRole];

    const userRole = String(userRoles[0] || 'USER')
        .toUpperCase()
        .replace('ROLE_', '');

    const profileApiAvailable = [
        'OWNER',
        'AGENCY',
        'CUSTOMER'
    ].includes(userRole);

    const getDashboardPath = () => {
        if (userRole === 'CUSTOMER') {
            return '/customer/dashboard';
        }

        if (userRole === 'AGENCY') {
            return '/agency/dashboard';
        }

        if (userRole === 'OWNER') {
            return '/owner/dashboard';
        }

        if (userRole === 'ADMIN') {
            return '/admin/dashboard';
        }

        return '/';
    };

    const handleCancel = () => {
        navigate(getDashboardPath());
    };

    /*
     * ---------------------------------------------------------
     * LOAD PROFILE
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * No customerId / ownerId / agencyId is required.
     *
     * Backend identifies the logged-in user from JWT.
     */
    const fetchProfile = useCallback(async () => {
        if (!profileApiAvailable) {
            setDbProfile(user || {});

            setForm(prev => ({
                ...prev,
                name: user?.name || '',
                phone: user?.phone || user?.phoneNumber || '',
                location: user?.location || ''
            }));

            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setLoadError('');
            setSaveError('');

            /*
             * GET:
             *
             * CUSTOMER -> /customers/profile
             * OWNER    -> /owner/profile
             * AGENCY   -> /agency/profile
             */
            const data = await fetchProfileByRole(userRole) || {};

            setDbProfile(data);

            setForm({
                name: data.name || '',
                phone: data.phone || '',
                dob: data.dob || '',
                licenseNo: data.licenseNo || '',
                location: data.location || '',
                address: {
                    doorNo: data.address?.doorNo || '',
                    street: data.address?.street || '',
                    area: data.address?.area || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    pincode: data.address?.pincode || '',
                    landmark: data.address?.landmark || ''
                }
            });

            /*
             * Load existing profile image.
             *
             * Only request image when backend says one exists.
             */
            if (data.hasProfileImage) {
                try {
                    const imageUrl =
                        await fetchProfileImageByRole(userRole);

                    setExistingImageUrl(imageUrl);
                } catch (imageError) {
                    console.warn(
                        'Unable to load profile image:',
                        imageError
                    );

                    setExistingImageUrl('');
                }
            } else {
                setExistingImageUrl('');
            }

        } catch (err) {
            console.error(
                'Error fetching profile details:',
                err
            );

            const responseData = err.response?.data;

            setLoadError(
                responseData?.message ||
                responseData?.error ||
                err.message ||
                'Unable to load profile details.'
            );
        } finally {
            setLoading(false);
        }
    }, [profileApiAvailable, userRole, user]);

    useEffect(() => {
        if (userRole) {
            fetchProfile();
        }
    }, [userRole, fetchProfile]);

    /*
     * ---------------------------------------------------------
     * CLEANUP EXISTING IMAGE URL
     * ---------------------------------------------------------
     */
    useEffect(() => {
        return () => {
            if (existingImageUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(existingImageUrl);
            }
        };
    }, [existingImageUrl]);

    /*
     * ---------------------------------------------------------
     * NEW IMAGE PREVIEW
     * ---------------------------------------------------------
     */
    useEffect(() => {
        if (!profileImage) {
            setImagePreview('');
            return undefined;
        }

        const previewUrl = URL.createObjectURL(profileImage);

        setImagePreview(previewUrl);

        return () => {
            URL.revokeObjectURL(previewUrl);
        };
    }, [profileImage]);

    /*
     * ---------------------------------------------------------
     * FORM CHANGE
     * ---------------------------------------------------------
     */
    const handleChange = (e) => {
        if (!profileApiAvailable) {
            return;
        }

        const { name, value } = e.target;

        if (name.startsWith('addr_')) {
            const field = name.replace('addr_', '');

            setForm(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [field]: value
                }
            }));
        } else {
            setForm(prev => ({
                ...prev,
                [name]: value
            }));
        }

        setSaveError('');
    };

    /*
     * ---------------------------------------------------------
     * IMAGE SELECT
     * ---------------------------------------------------------
     */
    const handleImageChange = (e) => {
        const image = e.target.files?.[0];

        if (!image) {
            return;
        }

        if (!image.type.startsWith('image/')) {
            setSaveError(
                'Please select a valid image file.'
            );

            e.target.value = '';
            return;
        }

        if (image.size > 5 * 1024 * 1024) {
            setSaveError(
                'Profile picture must be 5 MB or smaller.'
            );

            e.target.value = '';
            return;
        }

        setSaveError('');
        setProfileImage(image);
    };

    /*
     * ---------------------------------------------------------
     * REMOVE SELECTED NEW IMAGE
     * ---------------------------------------------------------
     */
    const handleCancelImageSelection = () => {
        setProfileImage(null);
        setImagePreview('');
    };

    /*
     * ---------------------------------------------------------
     * DELETE SAVED PROFILE IMAGE
     * ---------------------------------------------------------
     */
    const handleDeleteImage = async () => {
        if (!existingImageUrl || deletingImage) {
            return;
        }

        const confirmed = window.confirm(
            'Are you sure you want to delete your profile picture?'
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingImage(true);
            setSaveError('');

            await deleteProfileImageByRole(userRole);

            if (existingImageUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(existingImageUrl);
            }

            setExistingImageUrl('');
            setProfileImage(null);
            setImagePreview('');

        } catch (err) {
            console.error(
                'Profile image deletion failed:',
                err
            );

            const responseData = err.response?.data;

            setSaveError(
                responseData?.message ||
                responseData?.error ||
                err.message ||
                'Failed to delete profile picture.'
            );
        } finally {
            setDeletingImage(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * VALIDATION
     * ---------------------------------------------------------
     */
    const validateForm = () => {
        const name = form.name.trim();
        const phone = form.phone.trim();
        const dob = form.dob.trim();
        const licenseNo = form.licenseNo.trim();
        const location = form.location.trim();

        const address = form.address || EMPTY_ADDRESS;

        const street = address.street.trim();
        const city = address.city.trim();
        const state = address.state.trim();
        const pincode = address.pincode.trim();

        /*
         * AGENCY
         */
        if (userRole === 'AGENCY') {
            if (
                !name ||
                !location ||
                !street ||
                !city ||
                !state
            ) {
                return (
                    'Agency name, location, street, city, and state are required.'
                );
            }
        }

        /*
         * CUSTOMER
         */
        if (userRole === 'CUSTOMER') {
            if (
                !name ||
                !licenseNo ||
                !dob
            ) {
                return (
                    'Full name, Date of Birth, and Driving License Number are required.'
                );
            }

            if (!street || !city || !state) {
                return (
                    'Street, city, and state are required to save your customer profile.'
                );
            }
        }

        /*
         * OWNER
         */
        if (userRole === 'OWNER') {
            if (!name) {
                return 'Full name is required.';
            }
        }

        /*
         * NAME
         */
        if (
            !/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(name)
        ) {
            return (
                'Name must contain letters and may include spaces, apostrophes, periods, or hyphens.'
            );
        }

        /*
         * PHONE
         *
         * Corrected regex.
         */
        if (
            phone &&
            !/^\+?[0-9][0-9 ()-]{7,19}$/.test(phone)
        ) {
            return 'Enter a valid phone number.';
        }

        /*
         * LICENSE
         */
        if (
            userRole === 'CUSTOMER' &&
            !/^[A-Za-z0-9 -]{5,30}$/.test(licenseNo)
        ) {
            return (
                'Driving License Number must be 5 to 30 letters, numbers, spaces, or hyphens.'
            );
        }

        /*
         * PINCODE
         */
        if (
            pincode &&
            !/^[0-9]{4,10}$/.test(pincode)
        ) {
            return (
                'Pincode must contain 4 to 10 digits.'
            );
        }

        /*
         * DOB
         */
        if (
            dob &&
            dob > new Date().toISOString().split('T')[0]
        ) {
            return (
                'Date of Birth cannot be in the future.'
            );
        }

        return '';
    };

    /*
     * ---------------------------------------------------------
     * SAVE PROFILE
     * ---------------------------------------------------------
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!profileApiAvailable) {
            setSaveError(
                'Profile updates are not available for this account role.'
            );

            return;
        }

        const validationError = validateForm();

        if (validationError) {
            setSaveError(validationError);
            return;
        }

        /*
         * If all profile fields are locked and there is
         * no new image, there is nothing to update.
         */
        if (isFullyLocked() && !profileImage) {
            setSaveError(
                'Your profile details are already saved and locked. You can still change your profile picture.'
            );

            return;
        }

        setSaving(true);
        setSaveError('');

        try {
            /*
             * IMPORTANT:
             *
             * Do NOT send:
             *
             * id
             * customerId
             * ownerId
             * agencyId
             *
             * Backend gets current user from JWT.
             */
            const payload = {
                name: form.name.trim(),
                phone: form.phone.trim(),
                dob: form.dob || '',
                licenseNo: form.licenseNo.trim(),
                location: form.location.trim(),
                address: {
                    doorNo: form.address.doorNo.trim(),
                    street: form.address.street.trim(),
                    area: form.address.area.trim(),
                    city: form.address.city.trim(),
                    state: form.address.state.trim(),
                    pincode: form.address.pincode.trim(),
                    landmark: form.address.landmark.trim()
                }
            };

            const updatedData =
                await updateProfileByRole(
                    userRole,
                    payload,
                    profileImage
                ) || {};

            setDbProfile(updatedData);

            /*
             * Replace form with backend response.
             * This guarantees frontend reflects DB state.
             */
            setForm({
                name: updatedData.name || '',
                phone: updatedData.phone || '',
                dob: updatedData.dob || '',
                licenseNo: updatedData.licenseNo || '',
                location: updatedData.location || '',
                address: {
                    doorNo:
                        updatedData.address?.doorNo || '',
                    street:
                        updatedData.address?.street || '',
                    area:
                        updatedData.address?.area || '',
                    city:
                        updatedData.address?.city || '',
                    state:
                        updatedData.address?.state || '',
                    pincode:
                        updatedData.address?.pincode || '',
                    landmark:
                        updatedData.address?.landmark || ''
                }
            });

            /*
             * Synchronize AuthContext.
             *
             * Only update fields that belong in auth state.
             */
            if (updateUser) {
                updateUser({
                    name:
                        updatedData.name ||
                        form.name,

                    phone:
                        updatedData.phone ||
                        form.phone
                });
            }

            /*
             * Clear selected image.
             */
            setProfileImage(null);
            setImagePreview('');

            /*
             * Reload saved image from backend.
             */
            if (updatedData.hasProfileImage) {
                try {
                    const imageUrl =
                        await fetchProfileImageByRole(
                            userRole
                        );

                    setExistingImageUrl(imageUrl);
                } catch (imageError) {
                    console.warn(
                        'Unable to reload profile image:',
                        imageError
                    );
                }
            } else {
                setExistingImageUrl('');
            }

            setSaveError('');

        } catch (err) {
            console.error(
                'Save error:',
                err
            );

            const responseData = err.response?.data;

            const fieldErrors =
                responseData?.errors &&
                typeof responseData.errors === 'object'
                    ? Object.entries(responseData.errors)
                        .map(
                            ([field, message]) =>
                                `${field}: ${message}`
                        )
                        .join(', ')
                    : null;

            setSaveError(
                responseData?.message ||
                responseData?.error ||
                responseData?.details ||
                fieldErrors ||
                'Failed to update profile details.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (passwordForm.newPassword.length < 8 ||
            passwordForm.newPassword.length > 72 ||
            !/(?=.*[A-Za-z])(?=.*\d)/.test(passwordForm.newPassword)) {
            setPasswordError('New password must be 8-72 characters and contain letters and numbers.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setChangingPassword(true);
        try {
            await changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordMessage('Password updated successfully. Existing sessions remain active.');
        } catch (err) {
            setPasswordError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Unable to update password.'
            );
        } finally {
            setChangingPassword(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * FIELD LOCK
     * ---------------------------------------------------------
     */
    const isLocked = (value) => {
        return Boolean(
            value &&
            String(value).trim().length > 0
        );
    };

    /*
     * ---------------------------------------------------------
     * COMPLETE PROFILE LOCK
     * ---------------------------------------------------------
     */
    const isFullyLocked = () => {
        const profileName = dbProfile.name;

        /*
         * Location
         */
        if (!isLocked(dbProfile.location)) {
            return false;
        }

        /*
         * CUSTOMER
         */
        if (userRole === 'CUSTOMER') {
            if (
                !isLocked(profileName) ||
                !isLocked(dbProfile.dob) ||
                !isLocked(dbProfile.licenseNo)
            ) {
                return false;
            }
        }

        /*
         * OWNER
         */
        if (userRole === 'OWNER') {
            if (
                !isLocked(profileName) ||
                !isLocked(dbProfile.dob)
            ) {
                return false;
            }
        }

        /*
         * AGENCY
         */
        if (userRole === 'AGENCY') {
            if (!isLocked(profileName)) {
                return false;
            }
        }

        /*
         * Required address completion.
         */
        if (
            !isLocked(dbProfile.address?.doorNo) ||
            !isLocked(dbProfile.address?.street) ||
            !isLocked(dbProfile.address?.city) ||
            !isLocked(dbProfile.address?.state) ||
            !isLocked(dbProfile.address?.pincode)
        ) {
            return false;
        }

        return true;
    };

    /*
     * ---------------------------------------------------------
     * IMAGE TO DISPLAY
     * ---------------------------------------------------------
     */
    const displayImage =
        imagePreview ||
        existingImageUrl ||
        '';

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="profile-container">

            <style>{`
                .profile-container {
                    width: 100%;
                    min-height: calc(100vh - 64px);
                    background-color: #f8fafc;
                    padding: 2.5rem 1rem 4rem;
                    box-sizing: border-box;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    font-family: -apple-system, BlinkMacSystemFont,
                        "Segoe UI", Roboto, sans-serif;
                }

                .profile-card {
                    width: 100%;
                    max-width: 980px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow:
                        0 10px 25px -5px rgba(0, 0, 0, 0.05),
                        0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    padding: clamp(1.25rem, 3vw, 2.5rem);
                    box-sizing: border-box;
                }

                .profile-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .profile-title-flex {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .close-button {
                    margin-left: auto;
                    width: 32px;
                    height: 32px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #475569;
                    font-size: 1.25rem;
                    line-height: 1;
                    cursor: pointer;
                }

                .close-button:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .profile-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .badge-warning {
                    background-color: #fef3c7;
                    color: #d97706;
                    border: 1px solid #fde68a;
                }

                .badge-success {
                    background-color: #d1fae5;
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }

                .notice-text {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-top: 0.5rem;
                    margin-bottom: 0;
                }

                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .password-card {
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                }

                .password-card h2 {
                    margin: 0;
                    color: #0f172a;
                    font-size: 1.1rem;
                }

                .password-card p {
                    margin: 0 0 0.25rem;
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .password-fields {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 1rem;
                }

                .password-card input {
                    width: 100%;
                    min-height: 42px;
                    padding: 0 0.85rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #0f172a;
                }

                .password-card input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
                    outline: none;
                }

                .password-submit {
                    align-self: flex-start;
                    min-height: 42px;
                    padding: 0.65rem 1.25rem;
                    border: 0;
                    border-radius: 8px;
                    background: #0f766e;
                    color: #ffffff;
                    font-weight: 700;
                    cursor: pointer;
                }

                .password-submit:hover {
                    background: #115e59;
                }

                .password-submit:disabled {
                    background: #99f6e4;
                    cursor: not-allowed;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }

                .grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.25rem;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .field-label {
                    font-size: 0.825rem;
                    font-weight: 600;
                    color: #334155;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ui-input {
                    width: 100%;
                    height: 42px;
                    padding: 0 0.85rem;
                    background-color: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #0f172a;
                    box-sizing: border-box;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                }

                .ui-input::placeholder {
                    color: #94a3b8;
                }

                .ui-input:focus {
                    border-color: #2563eb;
                    box-shadow:
                        0 0 0 3px rgba(37, 99, 235, 0.12);
                }

                .ui-input:disabled {
                    background-color: #f8fafc;
                    border-color: #e2e8f0;
                    color: #64748b;
                    cursor: not-allowed;
                }

                .section-header {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 0.5rem;
                    padding-top: 1.25rem;
                    border-top: 1px solid #f1f5f9;
                }

                .lock-badge {
                    font-size: 0.725rem;
                    font-weight: 500;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                }

                .btn-row {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 0.75rem;
                    margin-top: 1rem;
                }

                .cancel-button {
                    background-color: #ffffff;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0.65rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    cursor: pointer;
                }

                .cancel-button:hover {
                    background-color: #f8fafc;
                }

                .save-button {
                    background-color: #2563eb;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 0.9rem;
                    padding: 0.65rem 1.5rem;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    transition:
                        background-color 0.2s ease,
                        transform 0.1s ease;
                }

                .save-button:hover {
                    background-color: #1d4ed8;
                }

                .save-button:active {
                    transform: scale(0.98);
                }

                .save-button:disabled {
                    background-color: #93c5fd;
                    cursor: not-allowed;
                }

                .image-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .profile-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #cbd5e1;
                    background: #f8fafc;
                }

                .image-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .delete-image-button {
                    background: #ffffff;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 0.45rem 0.75rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }

                .delete-image-button:hover {
                    background: #fef2f2;
                }

                .remove-selection-button {
                    background: #ffffff;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    padding: 0.45rem 0.75rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }

                @media (max-width: 640px) {
                    .profile-card {
                        padding: 1.5rem 1.25rem;
                    }

                    .grid-2,
                    .grid-3 {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .btn-row button {
                        width: 100%;
                    }

                    .btn-row {
                        flex-direction: column-reverse;
                        align-items: stretch;
                    }

                    .password-fields {
                        grid-template-columns: 1fr;
                    }

                    .password-submit {
                        width: 100%;
                    }
                }
            `}</style>

            <div className="profile-card">

                <div className="profile-header">

                    <div className="profile-title-flex">

                        <h1 className="profile-title">
                            {userRole} Profile
                        </h1>

                        <span
                            className={`badge ${
                                isFullyLocked()
                                    ? 'badge-success'
                                    : 'badge-warning'
                            }`}
                        >
                            {isFullyLocked()
                                ? 'Verified'
                                : 'Action Required'}
                        </span>

                        <button
                            type="button"
                            className="close-button"
                            onClick={handleCancel}
                            aria-label="Close profile"
                        >
                            &times;
                        </button>

                    </div>

                    {loadError && (
                        <div
                            role="alert"
                            style={{
                                color: '#92400e',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                padding: '0.75rem 1rem',
                                marginTop: '1rem'
                            }}
                        >
                            {loadError}
                        </div>
                    )}

                    <p className="notice-text">
                        {profileApiAvailable
                            ? (
                                isFullyLocked()
                                    ? 'Details are saved to the database and locked for security.'
                                    : 'Details submitted to the database cannot be changed later.'
                            )
                            : 'Profile management is not available for this account role.'}
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="profile-form"
                >

                    {saveError && (
                        <div
                            role="alert"
                            style={{
                                color: '#b91c1c',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '0.75rem 1rem'
                            }}
                        >
                            {saveError}
                        </div>
                    )}

                    <fieldset
                        disabled={
                            !profileApiAvailable ||
                            saving
                        }
                        style={{
                            border: 0,
                            padding: 0,
                            margin: 0,
                            display: 'contents'
                        }}
                    >

                        {/* EMAIL + LOCATION */}

                        <div className="grid-2">

                            <div className="field-group">

                                <label className="field-label">
                                    Account Email
                                </label>

                                <input
                                    className="ui-input"
                                    value={user?.email || ''}
                                    disabled
                                    readOnly
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    Primary Location / City

                                    {isLocked(
                                        dbProfile.location
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.location
                                    )}
                                    placeholder="e.g. Chennai"
                                />

                            </div>

                        </div>

                        {/* NAME + PHONE */}

                        <div className="grid-2">

                            <div className="field-group">

                                <label className="field-label">

                                    {userRole === 'AGENCY'
                                        ? 'Agency Name'
                                        : 'Full Name'}

                                    {isLocked(
                                        dbProfile.name
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.name
                                    )}
                                    placeholder={
                                        userRole === 'AGENCY'
                                            ? 'Enter agency name'
                                            : 'Enter full name'
                                    }
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    Phone Number

                                    {isLocked(
                                        dbProfile.phone
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.phone
                                    )}
                                    placeholder="+91 9876543210"
                                />

                            </div>

                        </div>

                        {/* PROFILE IMAGE */}

                        <div className="field-group">

                            <label className="field-label">
                                Profile Picture
                                <span
                                    style={{
                                        color: '#64748b',
                                        fontWeight: 400
                                    }}
                                >
                                    (optional)
                                </span>
                            </label>

                            <div className="image-wrapper">

                                {displayImage && (
                                    <img
                                        src={displayImage}
                                        alt="Profile"
                                        className="profile-image"
                                    />
                                )}

                                <div className="image-actions">

                                    <input
                                        className="ui-input"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={
                                            handleImageChange
                                        }
                                        style={{
                                            maxWidth: 360,
                                            paddingTop: '0.5rem'
                                        }}
                                    />

                                    {imagePreview && (
                                        <button
                                            type="button"
                                            className="remove-selection-button"
                                            onClick={
                                                handleCancelImageSelection
                                            }
                                        >
                                            Cancel Selected Image
                                        </button>
                                    )}

                                    {!imagePreview &&
                                        existingImageUrl && (
                                            <button
                                                type="button"
                                                className="delete-image-button"
                                                onClick={
                                                    handleDeleteImage
                                                }
                                                disabled={
                                                    deletingImage
                                                }
                                            >
                                                {deletingImage
                                                    ? 'Deleting...'
                                                    : 'Delete Profile Picture'}
                                            </button>
                                        )}

                                </div>

                            </div>

                            <p className="notice-text">
                                You can upload or replace your
                                profile picture at any time.
                                PNG, JPG, or WebP up to 5 MB.
                            </p>

                        </div>

                        {/* DOB + LICENSE */}

                        <div className="grid-2">

                            {(userRole === 'CUSTOMER' ||
                                userRole === 'OWNER') && (

                                <div className="field-group">

                                    <label className="field-label">

                                        Date of Birth

                                        {isLocked(
                                            dbProfile.dob
                                        ) && (
                                            <span className="lock-badge">
                                                🔒 Locked
                                            </span>
                                        )}

                                    </label>

                                    <input
                                        type="date"
                                        className="ui-input"
                                        name="dob"
                                        value={form.dob}
                                        onChange={
                                            handleChange
                                        }
                                        disabled={isLocked(
                                            dbProfile.dob
                                        )}
                                    />

                                </div>
                            )}

                            {userRole === 'CUSTOMER' && (

                                <div className="field-group">

                                    <label className="field-label">

                                        Driving License Number

                                        {isLocked(
                                            dbProfile.licenseNo
                                        ) && (
                                            <span className="lock-badge">
                                                🔒 Locked
                                            </span>
                                        )}

                                    </label>

                                    <input
                                        className="ui-input"
                                        name="licenseNo"
                                        value={
                                            form.licenseNo
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={isLocked(
                                            dbProfile.licenseNo
                                        )}
                                        placeholder="e.g. TN-0720230001234"
                                    />

                                </div>
                            )}

                        </div>

                        {/* ADDRESS */}

                        <div className="section-header">
                            Address Information
                        </div>

                        <div className="grid-2">

                            <div className="field-group">

                                <label className="field-label">

                                    Door / Flat No

                                    {isLocked(
                                        dbProfile.address?.doorNo
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_doorNo"
                                    value={
                                        form.address.doorNo
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.doorNo
                                    )}
                                    placeholder="Door/Flat No"
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    Street

                                    {isLocked(
                                        dbProfile.address?.street
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_street"
                                    value={
                                        form.address.street
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.street
                                    )}
                                    placeholder="Street name"
                                />

                            </div>

                        </div>

                        <div className="grid-2">

                            <div className="field-group">

                                <label className="field-label">

                                    Area / Locality

                                    {isLocked(
                                        dbProfile.address?.area
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_area"
                                    value={
                                        form.address.area
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.area
                                    )}
                                    placeholder="Area"
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    Landmark

                                    {isLocked(
                                        dbProfile.address?.landmark
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_landmark"
                                    value={
                                        form.address.landmark
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.landmark
                                    )}
                                    placeholder="Nearby landmark"
                                />

                            </div>

                        </div>

                        <div className="grid-3">

                            <div className="field-group">

                                <label className="field-label">

                                    City

                                    {isLocked(
                                        dbProfile.address?.city
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_city"
                                    value={
                                        form.address.city
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.city
                                    )}
                                    placeholder="City"
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    State

                                    {isLocked(
                                        dbProfile.address?.state
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_state"
                                    value={
                                        form.address.state
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.state
                                    )}
                                    placeholder="State"
                                />

                            </div>

                            <div className="field-group">

                                <label className="field-label">

                                    Pincode

                                    {isLocked(
                                        dbProfile.address?.pincode
                                    ) && (
                                        <span className="lock-badge">
                                            🔒 Locked
                                        </span>
                                    )}

                                </label>

                                <input
                                    className="ui-input"
                                    name="addr_pincode"
                                    value={
                                        form.address.pincode
                                    }
                                    onChange={handleChange}
                                    disabled={isLocked(
                                        dbProfile.address?.pincode
                                    )}
                                    placeholder="Pincode"
                                />

                            </div>

                        </div>

                    </fieldset>

                    <div className="btn-row">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>

                        {profileApiAvailable &&
                            (!isFullyLocked() ||
                                profileImage) && (

                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : 'Save Profile'}
                                </button>
                            )}

                    </div>

                </form>

                <form
                    onSubmit={handlePasswordSubmit}
                    className="password-card"
                >
                    <h2>Change password</h2>
                    <p>Use your current password to securely set a new one.</p>
                    {passwordError && <div role="alert" style={{ color: '#b91c1c' }}>{passwordError}</div>}
                    {passwordMessage && <div role="status" style={{ color: '#166534' }}>{passwordMessage}</div>}
                    <div className="password-fields">
                        <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="Current password"
                            autoComplete="current-password"
                        />
                        <input
                            type="password"
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="New password"
                            autoComplete="new-password"
                        />
                        <input
                            type="password"
                            required
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                    </div>
                    <button className="password-submit" type="submit" disabled={changingPassword}>
                        {changingPassword ? 'Updating...' : 'Update password'}
                    </button>
                </form>

            </div>

        </div>
    );
};

export default ProfileView;