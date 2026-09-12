import React from 'react';
import '../styles/Reports.css';

const ReportsTable = ({ reports, onEdit, onDelete, isLoading }) => {
    if (isLoading) {
        return <div className="spinner">Loading reports...</div>;
    }

    if (!reports || reports.length === 0) {
        return <div className="empty-state">No reports found. Create your first report!</div>;
    }

    return (
        <div className="table-container">
            <table className="reports-table">
                <thead>
                    <tr>
                        <th>Report ID</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr key={report.id}>
                            <td>{report.id}</td>
                            <td className="report-title">{report.title}</td>
                            <td>
                                <span className={`badge badge-${report.type?.toLowerCase()}`}>
                                    {report.type}
                                </span>
                            </td>
                            <td>{report.period}</td>
                            <td>
                                <span className={`status-badge status-${report.status?.toLowerCase()}`}>
                                    {report.status}
                                </span>
                            </td>
                            <td>{report.createdDate ? new Date(report.createdDate).toLocaleDateString() : '-'}</td>
                            <td className="actions-cell">
                                <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => onEdit(report)}
                                    title="Edit report"
                                >
                                    Edit
                                </button>
                                <button 
                                    className="btn btn-sm btn-info"
                                    onClick={() => onEdit({ ...report, viewOnly: true })}
                                    title="View report"
                                >
                                    View
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger"
                                    onClick={() => onDelete(report.id)}
                                    title="Delete report"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReportsTable;
