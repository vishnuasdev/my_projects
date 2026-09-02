import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reportsApi';
import ReportsTable from './ReportsTable';
import ReportForm from './ReportForm';
import AnalyticsTab from './AnalyticsTab';
import '../styles/Reports.css';

const ReportsManager = () => {
    const [activeTab, setActiveTab] = useState('REPORTS');
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [filters, setFilters] = useState({
        status: 'ALL',
        type: 'ALL'
    });

    useEffect(() => {
        if (activeTab === 'REPORTS') {
            fetchReports();
        }
    }, [activeTab, filters]);

    const fetchReports = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await reportsApi.getAllReports(filters);
            setReports(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            setError('Failed to load reports');
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateReport = () => {
        setEditingReport(null);
        setShowForm(true);
    };

    const handleEditReport = (report) => {
        setEditingReport(report);
        setShowForm(true);
    };

    const handleDeleteReport = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return;
        }

        setIsLoading(true);
        try {
            await reportsApi.deleteReport(id);
            setReports(prev => prev.filter(r => r.id !== id));
            alert('Report deleted successfully');
        } catch (err) {
            setError('Failed to delete report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveReport = async (reportData) => {
        setIsLoading(true);
        setError('');
        try {
            if (reportData.id) {
                // Update existing report
                const updated = await reportsApi.updateReport(reportData.id, reportData);
                setReports(prev =>
                    prev.map(r => r.id === reportData.id ? updated : r)
                );
                alert('Report updated successfully');
            } else {
                // Create new report
                const created = await reportsApi.createReport(reportData);
                setReports(prev => [created, ...prev]);
                alert('Report created successfully');
            }
            setShowForm(false);
            setEditingReport(null);
        } catch (err) {
            setError(err.message || 'Failed to save report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingReport(null);
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Reports & Analytics</h2>
                {!showForm && activeTab === 'REPORTS' && (
                    <button 
                        className="btn-create-report"
                        onClick={handleCreateReport}
                    >
                        + Create New Report
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="reports-tabs">
                <button 
                    className={`tab-button ${activeTab === 'REPORTS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('REPORTS')}
                >
                    Reports Management
                </button>
                <button 
                    className={`tab-button ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ANALYTICS')}
                >
                    Analytics Dashboard
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '12px 15px',
                    marginBottom: '15px',
                    backgroundColor: '#f8d7da',
                    color: '#842029',
                    borderRadius: '4px',
                    border: '1px solid #f5c6cb'
                }}>
                    {error}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'REPORTS' && (
                <>
                    {!showForm ? (
                        <>
                            {/* Filters */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                            }}>
                                <div>
                                    <label style={{ marginRight: '8px', fontWeight: '500' }}>
                                        Status:
                                    </label>
                                    <select 
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="ALL">All</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ marginRight: '8px', fontWeight: '500' }}>
                                        Type:
                                    </label>
                                    <select 
                                        value={filters.type}
                                        onChange={(e) => handleFilterChange('type', e.target.value)}
                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="ALL">All</option>
                                        <option value="REVENUE">Revenue</option>
                                        <option value="BOOKING">Booking</option>
                                        <option value="FLEET">Fleet</option>
                                        <option value="USER">User</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reports Table */}
                            <ReportsTable 
                                reports={reports}
                                onEdit={handleEditReport}
                                onDelete={handleDeleteReport}
                                isLoading={isLoading}
                            />
                        </>
                    ) : (
                        /* Report Form */
                        <ReportForm 
                            report={editingReport}
                            onSave={handleSaveReport}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            viewOnly={editingReport?.viewOnly}
                        />
                    )}
                </>
            )}

            {activeTab === 'ANALYTICS' && (
                <AnalyticsTab />
            )}
        </div>
    );
};

export default ReportsManager;
