import React, { useState, useEffect } from 'react';
import '../styles/Reports.css';

const ReportForm = ({ report, onSave, onCancel, isLoading, viewOnly = false }) => {
    const [formData, setFormData] = useState({
        title: '',
        type: 'REVENUE',
        period: 'MONTHLY',
        description: '',
        startDate: '',
        endDate: '',
        filters: [],
        status: 'DRAFT',
        ...report
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (report) {
            setFormData({
                title: report.title || '',
                type: report.type || 'REVENUE',
                period: report.period || 'MONTHLY',
                description: report.description || '',
                startDate: report.startDate || '',
                endDate: report.endDate || '',
                filters: report.filters || [],
                status: report.status || 'DRAFT',
                ...report
            });
        }
    }, [report]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate > formData.endDate) {
            newErrors.endDate = 'End date must be after start date';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    return (
        <div className="report-form">
            <h3>{report?.id ? 'Edit Report' : 'Create New Report'}</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Report Title *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        disabled={viewOnly}
                        className={errors.title ? 'error' : ''}
                        placeholder="e.g., Monthly Revenue Report"
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="type">Report Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            disabled={viewOnly}
                        >
                            <option value="REVENUE">Revenue</option>
                            <option value="BOOKING">Booking</option>
                            <option value="FLEET">Fleet</option>
                            <option value="USER">User</option>
                            <option value="CUSTOM">Custom</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="period">Period</label>
                        <select
                            id="period"
                            name="period"
                            value={formData.period}
                            onChange={handleChange}
                            disabled={viewOnly}
                        >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="startDate">Start Date *</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            disabled={viewOnly}
                            className={errors.startDate ? 'error' : ''}
                        />
                        {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="endDate">End Date *</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            disabled={viewOnly}
                            className={errors.endDate ? 'error' : ''}
                        />
                        {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={viewOnly}
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={viewOnly}
                        placeholder="Add any notes or details about this report..."
                        rows="4"
                    />
                </div>

                {!viewOnly && (
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : (report?.id ? 'Update Report' : 'Create Report')}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {viewOnly && (
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Close
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ReportForm;
