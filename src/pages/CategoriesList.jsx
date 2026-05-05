import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import CategoryItem from '../components/CategoryItem';
import { useAuth } from '../context/AuthContext';
import { canManageAppResources, isadmin } from '../utils/permissions';
import axiosInstance from '../api/axiosInstance';
import SearchBar from '../components/SearchBar';

const CategoriesList = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageAppResources(user, appId);
  const isadminUser = isadmin(user);

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_APP_VIEW(appId));
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch categories');
      }

      setCategories(data.categories || []);
      setFilteredCategories(data.categories || []);
      if (data.app && data.app.name) {
        setAppName(data.app.name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCategory = async (categoryId) => {
    if (!canManage) return;
    if (!window.confirm("Are you sure you want to remove this category from the app?")) return;

    try {
      setError(null);
      const response = await axiosInstance.patch(API_ENDPOINTS.DELETE_APP_CATEGORY, { appId, categoryId });
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to remove category');
      }

      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      setSuccessMessage('Category removed from app');
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading categories…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="container-fluid">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Apps
          </button>
          <span>/</span>
          <span>{appName || 'Categories'}</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>{appName || 'Categories'}</h1>
          <p className="subtitle">Browse and manage categories for this application</p>
        </div>

        {/* Actions */}
        <div className="action-bar">
          <SearchBar 
            data={categories}
            searchKeys={['name']}
            placeholder="Search categories..."
            onResults={setFilteredCategories}
          />
          {canManage && (
            <div className="action-group">
              <button
                className="btn-ghost"
                onClick={() => navigate(`/add-existing/${appId}`)}
              >
                ➕ Add Existing
              </button>
              <button
                className="btn btn-accent"
                onClick={() => navigate(`/create-category/${appId}`)}
              >
                ✨ New Category
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {/* {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="btn-ghost ms-auto" onClick={fetchCategories}>Retry</button>
          </div>
        )} */}
        {/* {successMessage && <div className="success-alert mb-3">✅ {successMessage}</div>} */}

        {/* List */}
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>{categories.length > 0 ? "No matching categories found." : "No categories yet. Create a new category or link an existing one."}</p>
          </div>
        ) : (
          <div className="apps-grid stagger-list">
            {filteredCategories.map((cat) => (
              <CategoryItem
                key={cat._id}
                image={cat.thumbnail || cat.image}
                name={cat.name}
                onClick={() => navigate(`/assets/${appId}/${cat._id}`)}
                onEdit={() => navigate(`/edit-category/${cat._id}`)}
                onDelete={() => handleRemoveCategory(cat._id)}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesList;
