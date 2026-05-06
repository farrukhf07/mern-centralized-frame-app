import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import axiosInstance from '../api/axiosInstance';
import CategoryItem from '../components/CategoryItem';
import { isadmin } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import AssetPreviewModal from '../components/AssetPreviewModal';
import SearchBar from '../components/SearchBar';

const AllAssets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  

  useEffect(() => {
    if (!isadmin(user)) {
      navigate('/');
      return;
    }
    fetchAssets();
  }, [user]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_ASSETS_LIST);
      if (response.data.success) {
        setAssets(response.data.assets || []);
        setFilteredAssets(response.data.assets || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = (asset) => {
    // Navigate to edit page with placeholder appId/categoryId as it's from global list
    navigate(`/edit-asset/global/global/${asset._id}`);
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset permanently?')) return;
    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.DELETE_ASSET(assetId));
      if (response.data.success) {
        setAssets(prev => prev.filter(a => a._id !== assetId));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openPreviewModal = (asset) => {
    setSelectedAsset(asset);
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedAsset(null);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading All Assets...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="container-fluid">
        <div className="breadcrumb-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <span>/</span>
          <span>Central Data</span>
          <span>/</span>
          <span>All Assets</span>
        </div>

        <div className="page-header d-flex justify-content-between align-items-start">
          <div>
            <h1>All Assets</h1>
            <p className="subtitle">Manage all assets across all categories</p>
          </div>
        </div>
        <div className="action-bar">
          <SearchBar 
            data={assets}
            searchKeys={['name', 'tag']}
            placeholder="Search all assets..."
            onResults={setFilteredAssets}
          />
          <span className="card-meta">{filteredAssets.length} results</span>
        </div>
        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="btn-ghost ms-auto" onClick={fetchAssets}>Retry</button>
          </div>
        )}

        <div className="apps-grid stagger-list">
          {filteredAssets.map((asset) => (
            <div key={asset._id} className="asset-card-wrapper" style={{ minWidth: '200px' }}>
              <CategoryItem
                image={asset.thumbnail || asset.image}
                name={asset.name}
                onClick={() => openPreviewModal(asset)}
                onEdit={() => handleEditAsset(asset)}
                onHardDelete={() => handleDeleteAsset(asset._id)}
                canManage={true}
                canHardDelete={true}
                asset={true}
                tag={asset.tag}
                width={asset.width}
                height={asset.height}
                isEnable={asset.isEnable}
                isPremium={asset.isPremium}
              />
            </div>
          ))}
        </div>

        {filteredAssets.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🖼️</div>
            <p>{assets.length > 0 ? "No matching assets found." : "No assets found."}</p>
          </div>
        )}
      </div>
      <AssetPreviewModal
        isOpen={isPreviewModalOpen}
        asset={selectedAsset}
        onClose={closePreviewModal}
      />
    </div>
  );
};

export default AllAssets;
