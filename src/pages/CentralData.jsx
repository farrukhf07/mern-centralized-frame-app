import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import axiosInstance from '../api/axiosInstance';
import CategoryItem from '../components/CategoryItem';
import { isadmin } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';

const CentralData = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!isadmin(user)) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const catRes = await axiosInstance.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
      setCategories(catRes.data.categories || []);
      setFilteredCategories(catRes.data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated assets will also be deleted.')) return;
    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_CATEGORY(catId));
      if (response.data.success) {
        setCategories(prev => prev.filter(c => c._id !== catId));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading Central Data...</span>
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
            <h1>Central Data</h1>
            <p className="subtitle">Manage all categories and assets globally</p>
          </div>
        </div>

        {/* Actions */}
        <div className="action-bar mb-4">
          <SearchBar 
            data={categories}
            searchKeys={['name']}
            placeholder="Search categories..."
            onResults={setFilteredCategories}
          />
          <div className="d-flex gap-3">
            <button className="btn btn-ghost" onClick={() => navigate('/all-assets')}>
              🖼️ View All Assets
            </button>
            <button className="btn btn-accent" onClick={() => navigate('/create-category')}>
              ➕ Add New Category
            </button>
          </div>
        </div>

        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="btn-ghost ms-auto" onClick={fetchData}>Retry</button>
          </div>
        )}

        <div className="apps-grid stagger-list">
          {filteredCategories.map((cat) => (
            <div key={cat._id} className="category-card-wrapper" style={{ minWidth: '200px' }}>
              <CategoryItem
                image={cat.thumbnail || cat.image}
                name={cat.name}
                onEdit={() => navigate(`/edit-category/${cat._id}`)}
                onHardDelete={() => handleDeleteCategory(cat._id)}
                onClick={() => navigate(`/central-data/assets/${cat._id}`)}
                canManage={true}
                canHardDelete={true}
              />
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>{categories.length > 0 ? "No matching categories found." : "No categories found."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralData;
