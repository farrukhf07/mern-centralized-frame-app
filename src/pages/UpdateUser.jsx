import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import axiosInstance from '../api/axiosInstance';
import { MANAGEABLE_ROLES, ROLES } from '../constants/roles';

import { isadmin } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';

const ManageUsers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Form state
  const [editForm, setEditForm] = useState({ name: '', role: ROLES.USER, excess: [] });
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: ROLES.USER });

  useEffect(() => {
    if (!isadmin(currentUser)) {
      navigate('/');
      return;
    }
    bootstrap();
  }, [currentUser]);

  const bootstrap = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, appsRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.GET_ALL_USERS),
        axiosInstance.get(API_ENDPOINTS.GET_ALL_APPS),
      ]);
      setUsers(usersRes?.data || []);
      setFilteredUsers(usersRes?.data || []);
      setApps(appsRes?.data?.apps || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      role: user.role || ROLES.USER,
      excess: (user.excess || []).map(String),
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsCreateModalOpen(false);
    setSelectedUser(null);
    setSuccess('');
    setError('');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        name: editForm.name.trim(),
        role: editForm.role,
        excess: editForm.role === ROLES.manager ? editForm.excess : [],
      };
      const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_USER(selectedUser._id), payload);
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, ...payload } : u));
      setSuccess(response?.data?.message || 'User updated successfully');
      setTimeout(handleCloseModals, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const response = await axiosInstance.post(API_ENDPOINTS.CREATE_USER, createForm);
      if (response.data.success) {
        setUsers(prev => [...prev, response.data.user]);
        setSuccess('User created successfully');
        setTimeout(handleCloseModals, 1500);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?._id) {
      alert("You cannot delete yourself!");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_USER(userId));
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert(response.data.message || 'User deleted successfully');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const toggleAppAssignment = (appId) => {
    setEditForm((prev) => {
      const exists = prev.excess.includes(appId);
      return {
        ...prev,
        excess: exists ? prev.excess.filter((id) => id !== appId) : [...prev.excess, appId],
      };
    });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="container-fluid">
        <div className="page-header d-flex justify-content-between align-items-start">
          <div>
            <h1>User Management</h1>
            <p className="subtitle">admin-only access to user roles and application assignments</p>
          </div>
        </div>

        {/* Actions */}
        <div className="action-bar mb-4">
          <SearchBar 
            data={users}
            searchKeys={['name', 'email']}
            placeholder="Search users..."
            onResults={setFilteredUsers}
          />
          <button className="btn btn-accent" onClick={() => setIsCreateModalOpen(true)}>
            ➕ Create New User
          </button>
        </div>

        {error && <div className="error-alert mb-3">⚠️ {error}</div>}
        {success && <div className="success-alert mb-3">✅ {success}</div>}

        {/* Users Grid */}
        <div className="apps-grid stagger-list">
          {filteredUsers.map((u) => (
            <div key={u._id} className="glass-card" onClick={() => handleOpenEdit(u)}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="card-icon" style={{ background: u.role === ROLES.admin ? 'var(--warning)' : 'var(--accent-gradient)' }}>
                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="card-title text-truncate">{u.name}</div>
                  <div className="card-meta text-truncate" style={{ maxWidth: '100%', opacity: 0.7 }}>{u.email}</div>
                </div>
                <div className="d-flex gap-1 flex-shrink-0">
                  <button className="btn-sm-delete" onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }}>
                    DELETE
                  </button>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className={`card-badge ${u.role === ROLES.admin ? 'badge-premium' : 'badge-active'}`}>
                  {u.role}
                </span>
                {u.role === ROLES.manager && (
                  <span className="card-meta" style={{ fontSize: '0.7rem' }}>
                    {u.excess?.length || 0} Apps Assigned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredUsers.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>{users.length > 0 ? "No matching users found." : "No users found."}</p>
          </div>
        )}


      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="theme-modal-overlay open" onClick={handleCloseModals}>
          <div className="theme-modal-card open" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="theme-modal-close btn-sm-icon" onClick={handleCloseModals}>X</button>
            <div className="theme-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingBottom: '1.5rem' }}>
              <h3 className="mb-4">Edit User Permissions</h3>
              <form onSubmit={handleUpdateSubmit} className="glass-form w-100 p-0" style={{ background: 'transparent', border: 'none' }}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input 
                    className="form-control" 
                    value={editForm.name} 
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <div className="position-relative">
                      <select 
                      className="form-select" 
                      value={editForm.role} 
                      onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    >
                      {MANAGEABLE_ROLES.map(role => (
                        <option key={role} value={role} style={{ color: 'black' }}>{role}</option>
                      ))}
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >▼</span>
                  </div>
                </div>
                {editForm.role === ROLES.manager && (
                  <div className="mb-4">
                    <label className="form-label">Assign Apps</label>
                    <div className="stagger-list" style={{ maxHeight: '200px', overflowY: 'auto', padding: '5px' }}>
                      {apps.map(app => {
                        const checked = editForm.excess.includes(app._id);
                        return (
                          <label key={app._id} className={`checkbox-list-item ${checked ? 'selected' : ''}`} style={{ padding: '0.5rem 0.75rem', marginBottom: '4px' }}>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={checked} 
                              onChange={() => toggleAppAssignment(app._id)} 
                            />
                            <span style={{ fontSize: '0.85rem' }}>{app.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button type="submit" className="btn btn-accent w-100" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
              </form>
            </div>
            <div className="theme-modal-footer"></div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="theme-modal-overlay open" onClick={handleCloseModals}>
          <div className="theme-modal-card open" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="theme-modal-close btn-sm-icon" onClick={handleCloseModals}>X</button>
            <div className="theme-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingBottom: '1.5rem' }}>
              <h3 className="mb-4">Create New User</h3>
              <form onSubmit={handleCreateSubmit} className="glass-form w-100 p-0" style={{ background: 'transparent', border: 'none' }}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input 
                    className="form-control" 
                    value={createForm.name} 
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={createForm.email} 
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={createForm.password} 
                    onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">Initial Role</label>
                  <select 
                    className="form-select" 
                    value={createForm.role} 
                    onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                  >
                    {MANAGEABLE_ROLES.map(role => (
                      <option key={role} value={role} style={{ color: 'black' }}>{role}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-accent w-100" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
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

export default ManageUsers;
