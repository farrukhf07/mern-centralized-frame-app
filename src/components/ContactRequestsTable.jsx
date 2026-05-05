import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import axiosInstance from '../api/axiosInstance';

const ContactRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_REQUEST);
      setRequests(response.data || []);
    } catch (err) {
      setError('Failed to load contact requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      setActionLoading(id);
      await axiosInstance.put(API_ENDPOINTS.ACCEPT_EMAIL_REQUEST(id));
      setRequests(prev => prev.map(req => 
        req._id === id ? { ...req, status: 'accepted' } : req
      ));
      setSuccess('Request accepted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to accept request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      await axiosInstance.put(API_ENDPOINTS.REJECT_EMAIL_REQUEST(id));
      setRequests(prev => prev.map(req => 
        req._id === id ? { ...req, status: 'rejected' } : req
      ));
      setSuccess('Request rejected successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to reject request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      setActionLoading(id);
      await axiosInstance.delete(API_ENDPOINTS.DELETE_EMAIL_REQUEST(id));
      setRequests(prev => prev.filter(req => req._id !== id));
      setSuccess('Request deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete request');
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container mt-5">
        <div className="spinner-glow"></div>
        <span className="loading-text">Fetching contact requests...</span>
      </div>
    );
  }

  return (
    <div className="mt-5 fade-in">
      <div className="page-header mb-4">
        <h1 style={{ color: 'var(--text-primary)' }}>📩 Contact Requests</h1>
        <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>Review and manage incoming inquiries from users</p>
      </div>

      {error && <div className="error-alert mb-3">⚠️ {error}</div>}
      {success && <div className="success-alert mb-3">✅ {success}</div>}

      {/* Container background set to transparent/glass */}
      <div className="glass-card p-0 overflow-hidden shadow-sm" style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="table-responsive">
          <table className="table theme-table mb-0" style={{ background: 'transparent', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <th style={{ padding: '1.2rem 1rem', color: 'var(--text-primary)', borderBottom: 'none' }}>Name</th>
                <th style={{ padding: '1.2rem 1rem', color: 'var(--text-primary)', borderBottom: 'none' }}>Email</th>
                <th style={{ padding: '1.2rem 1rem', color: 'var(--text-primary)', borderBottom: 'none' }}>Message</th>
                <th style={{ padding: '1.2rem 1rem', borderBottom: 'none' }} className="text-end text-primary">Actions</th>
              </tr>
            </thead>
            <tbody style={{ background: 'transparent' }}>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div className="empty-state">
                      <div className="empty-icon" style={{ fontSize: '2rem' }}>📭</div>
                      <p>No requests at the moment.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="align-middle theme-row">
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.firstName} {req.lastName}
                      </div>
                    </td>
                    <td title={req.email} style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{req.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <div className="message-cell" title={req.message} style={{ maxWidth: '300px', color: 'var(--text-secondary)', opacity: 1 }}>
                        {req.message}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }} className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {req.status !== 'accepted' && req.status !== 'rejected' && (
                          <>
                            <button 
                              className="btn-sm-icon" 
                              onClick={() => handleAccept(req._id)}
                              disabled={actionLoading === req._id}
                              title="Accept"
                              style={{ borderColor: 'rgba(34, 197, 94, 0.5)', color: '#4ade80' }}
                            >
                              ✔
                            </button>
                            <button 
                              className="btn-sm-icon" 
                              onClick={() => handleReject(req._id)}
                              disabled={actionLoading === req._id}
                              title="Reject"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
                            >
                              ✖
                            </button>
                          </>
                        )}
                        <button 
                          className="btn-sm-icon danger-btn" 
                          onClick={() => handleDelete(req._id)}
                          disabled={actionLoading === req._id}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Remove Default Bootstrap Table Backgrounds */
        .theme-table {
          --bs-table-bg: transparent !important;
          --bs-table-hover-bg: transparent !important;
          color: var(--text-primary) !important;
        }

        /* Set Default Row background to match hover color */
        .theme-row {
          background: rgba(255, 255, 255, 0.03) !important;
          transition: all 0.2s ease;
        }

        .theme-row:hover {
          background: rgba(255, 255, 255, 0.07) !important;
          transform: scale(1.002);
        }

        .theme-row td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          background: transparent !important;
        }

        .btn-sm-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-sm-icon:hover:not(:disabled) {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.12);
        }

        .danger-btn {
          color: #ff4d4d;
          border-color: rgba(255, 77, 77, 0.3);
        }

        .danger-btn:hover {
          background: rgba(255, 77, 77, 0.15) !important;
          border-color: #ff4d4d !important;
        }

        .btn-sm-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .message-cell {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}} />
    </div>
  );
};

export default ContactRequestsTable;