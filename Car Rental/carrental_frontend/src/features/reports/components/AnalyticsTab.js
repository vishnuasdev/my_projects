import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../api/reportsApi';
import '../styles/Reports.css';

const AnalyticsTab = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: 'all'
    });

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await reportsApi.getAnalytics(filters);
            setAnalyticsData(data);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = () => {
        fetchAnalytics();
    };

    if (isLoading) {
        return <div className="spinner">Loading analytics...</div>;
    }

    return (
        <div className="analytics-tab">
            <div className="analytics-filters">
                <h4>Analytics Filters</h4>
                <div className="filter-group">
                    <div className="form-group">
                        <label htmlFor="analyticsStartDate">Start Date</label>
                        <input
                            type="date"
                            id="analyticsStartDate"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="analyticsEndDate">End Date</label>
                        <input
                            type="date"
                            id="analyticsEndDate"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="analyticsType">Type</label>
                        <select
                            id="analyticsType"
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All</option>
                            <option value="REVENUE">Revenue</option>
                            <option value="BOOKING">Booking</option>
                            <option value="FLEET">Fleet</option>
                            <option value="USER">User</option>
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={handleApplyFilters}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {analyticsData && (
                <div className="analytics-content">
                    <div className="analytics-cards">
                        <div className="analytics-card">
                            <h4>Total Reports</h4>
                            <div className="analytics-value">
                                {analyticsData.totalReports || 0}
                            </div>
                        </div>
                        <div className="analytics-card">
                            <h4>Total Revenue</h4>
                            <div className="analytics-value">
                                ${(analyticsData.totalRevenue || 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="analytics-card">
                            <h4>Total Bookings</h4>
                            <div className="analytics-value">
                                {analyticsData.totalBookings || 0}
                            </div>
                        </div>
                        <div className="analytics-card">
                            <h4>Active Fleet</h4>
                            <div className="analytics-value">
                                {analyticsData.activeFleet || 0}
                            </div>
                        </div>
                    </div>

                    <div className="analytics-charts">
                        <div className="chart-container">
                            <h4>Revenue Trend</h4>
                            {analyticsData.revenueTrend && analyticsData.revenueTrend.length > 0 ? (
                                <div className="chart-placeholder">
                                    <p>Revenue Chart Data Ready</p>
                                    <ul className="chart-data-list">
                                        {analyticsData.revenueTrend.slice(0, 5).map((item, idx) => (
                                            <li key={idx}>
                                                {item.month || item.date}: ${(item.revenue || 0).toLocaleString()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="no-data">No data available</p>
                            )}
                        </div>

                        <div className="chart-container">
                            <h4>Booking Statistics</h4>
                            {analyticsData.bookingStats && Object.keys(analyticsData.bookingStats).length > 0 ? (
                                <div className="chart-placeholder">
                                    <p>Booking Statistics</p>
                                    <ul className="chart-data-list">
                                        {Object.entries(analyticsData.bookingStats).map(([key, value], idx) => (
                                            <li key={idx}>{key}: {value}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="no-data">No data available</p>
                            )}
                        </div>
                    </div>

                    {analyticsData.summary && (
                        <div className="analytics-summary">
                            <h4>Summary</h4>
                            <p>{analyticsData.summary}</p>
                        </div>
                    )}
                </div>
            )}

            {!analyticsData && !isLoading && !error && (
                <div className="empty-state">No analytics data available</div>
            )}
        </div>
    );
};

export default AnalyticsTab;
