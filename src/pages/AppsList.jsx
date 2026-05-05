import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import { useAuth } from '../context/AuthContext';
import { canManageAppResources, isadmin,} from '../utils/permissions';
import axiosInstance from '../api/axiosInstance';
import SearchBar from '../components/SearchBar';

const AppsList = () => {
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '', status: 'active', appurl: '' });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isadmin(user);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ALL_APPS);
      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch apps');
      }
      setApps(data.apps || []);
      setFilteredApps(data.apps || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        name: app.name || '',
        type: app.type || '',
        status: app.status || 'active',
        appurl: app.appurl || ''
      });
    } else {
      setEditingApp(null);
      setFormData({ name: '', type: '', status: 'active', appurl: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingApp) {
        const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_APP(editingApp._id), formData);
        if (response.data.success) {
          setApps(prev => prev.map(a => a._id === editingApp._id ? response.data.app : a));
          handleCloseModal();
        }
      } else {
        const response = await axiosInstance.post(API_ENDPOINTS.CREATE_NEW_APP, formData);
        if (response.data.success) {
          setApps(prev => [...prev, response.data.app]);
          handleCloseModal();
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApp = async (e, appId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_APP(appId));
      if (response.data.success) {
        setApps(prev => prev.filter(a => a._id !== appId));
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading applications…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="container-fluid">
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-start">
          <div>
            <h1>Applications</h1>
            <p className="subtitle">Manage your connected applications and their asset libraries</p>
          </div>
        </div>

        {/* Actions */}
        <div className="action-bar mb-4">
          <SearchBar 
            data={apps}
            searchKeys={['name']}
            placeholder="Search apps..."
            onResults={setFilteredApps}
          />
          {admin && (
            <button className="btn btn-accent" onClick={() => handleOpenModal()}>
              ➕ Create New App
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="btn-ghost ms-auto" onClick={fetchApps}>Retry</button>
          </div>
        )}

        {/* Apps Grid */}
        {filteredApps.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>{apps.length > 0 ? "No matching apps found." : "No applications found. Create one to get started."}</p>
          </div>
        ) : (
          <div className="apps-grid stagger-list">
            {filteredApps.map((app) => (
              <div
                key={app._id}
                className="glass-card"
                onClick={() => navigate(`/categories/${app._id}`)}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="card-icon">
                    {app.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-grow-1">
                    <div className="card-title">{app.name}</div>
                    <div className="card-meta">{app.type || 'Application'}</div>
                  </div>
                  {admin && (
                    <div className="d-flex gap-1">
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: '0.65rem', padding: '0.35rem 0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(app); }}
                        title="Edit App"
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-sm-delete" 
                        onClick={(e) => handleDeleteApp(e, app._id)}
                        title="Delete App"
                      >
                        DELETE
                      </button>
                    </div>
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between">
                  <span className={`card-badge ${app.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {app.status || 'unknown'}
                  </span>
                  {!canManageAppResources(user, app._id) && (
                    <span className="card-meta" style={{ fontSize: '0.75rem' }}>
                      View only
                    </span>
                  )}
                </div>

                {app.appurl && (
                  <div className="card-meta mt-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    🔗 {app.appurl}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* App Modal */}
      {isModalOpen && (
        <div className="theme-modal-overlay open" onClick={handleCloseModal}>
          <div className="theme-modal-card open" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <button className="theme-modal-close btn-sm-icon" onClick={handleCloseModal}>X</button>
            <div className="theme-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingBottom: '1.5rem' }}>
              <h3 className="mb-4">{editingApp ? 'Edit Application' : 'Create New Application'}</h3>
              <form onSubmit={handleSubmit} className="glass-form w-100 p-0" style={{background: 'transparent', border: 'none'}}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select 
                    name="status" 
                    className="form-select" 
                    value={formData.status} 
                    onChange={handleFormChange}
                  >
                    <option value="active" style={{color: 'black'}}>Active</option>
                    <option value="inactive" style={{color: 'black'}}>Inactive</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label">Bundle ID</label>
                  <input 
                    type="text" 
                    name="bundleId" 
                    className="form-control" 
                    value={formData.bundleId} 
                    onChange={handleFormChange}
                  />
                </div>
                <button type="submit" className="btn btn-accent w-100" disabled={submitting}>
                  {submitting ? 'Saving...' : editingApp ? 'Update App' : 'Create App'}
                </button>
              </form>
            </div>
            <div className="theme-modal-footer"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppsList;
