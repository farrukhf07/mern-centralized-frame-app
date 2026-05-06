import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';
import CategoryItem from '../components/CategoryItem';
import CoordinatesUploadModal from '../components/CoordinatesUploadModal';
import AssetPreviewModal from '../components/AssetPreviewModal';
import { useAuth } from '../context/AuthContext';
import { canManageAppResources, isadmin } from '../utils/permissions';
import axiosInstance from '../api/axiosInstance';
import SearchBar from '../components/SearchBar';

const AssetsList = () => {
  const { appId, categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageAppResources(user, appId);
  const isadminUser = isadmin(user);

  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [jsonValidationError, setJsonValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(API_ENDPOINTS.GET_APP_VIEW(appId));
      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch assets');
      }

      if (data.app && data.app.name) {
        setAppName(data.app.name);
      }

      // Find the current category in the app view hierarchy
      const currentCat = data.categories.find(cat => cat._id === categoryId);
      if (currentCat) {
        setAssets(currentCat.assets || []);
        setFilteredAssets(currentCat.assets || []);
        setCategoryName(currentCat.name);
      } else {
        setAssets([]);
        setFilteredAssets([]);
        setCategoryName('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAsset = async (assetId) => {
    if (!canManage) return;
    if (!window.confirm("Are you sure you want to remove this asset?")) return;

    try {
      setError(null);
      const response = await axiosInstance.patch(API_ENDPOINTS.REMOVE_ASSET_FROM_APP, {
        appId,
        categoryId,
        assetId,
      });
      const data = response.data;
      if (data.success) {
        setAssets((prev) => prev.filter((a) => a._id !== assetId));
        setFilteredAssets((prev) => prev.filter((a) => a._id !== assetId));
        setSuccessMessage('Asset removed from app');
      } else {
        throw new Error(data.message || 'Failed to remove asset');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error removing asset');
    }
  };

  const modalPlaceholder = `[
  {
    "name": "frame_1",
    "x": "200",
    "y": "412",
    "width": "303",
    "height": "630",
    "rotation": "2.3",
    "elevation": "1"
  },
  {
    "name": "frame_2",
    "x": "222",
    "y": "422",
    "width": "203",
    "height": "632",
    "rotation": "2.2",
    "elevation": "1"
  }
]`;

  const validateJson = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, parsed: null, message: 'JSON input is required' };
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { isValid: false, parsed: null, message: 'Input must be a JSON array' };
      }
      return { isValid: true, parsed, message: '' };
    } catch (err) {
      return { isValid: false, parsed: null, message: 'Invalid JSON format' };
    }
  };

  const handleCoordinatesChange = (value) => {
    setCoordinatesInput(value);
    setSuccessMessage('');
    const result = validateJson(value);
    setJsonValidationError(result.isValid || !value.trim() ? '' : result.message);
  };

  const closeUploadModal = () => {
    setCoordinatesInput('');
    setJsonValidationError('');
    setIsUploading(false);
    setIsUploadModalOpen(false);
  };

  const handleUploadCoordinates = async () => {
    const validation = validateJson(coordinatesInput);
    if (!validation.isValid) {
      setJsonValidationError(validation.message);
      return;
    }

    try {
      setIsUploading(true);
      setJsonValidationError('');
      setError(null);
      setSuccessMessage('');

      const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_BULK_COORDINATES, {
        categoryId,
        data: validation.parsed,
      });

      const data = response.data;
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to upload coordinates');
      }

      setSuccessMessage(data.message || 'Coordinates uploaded successfully');
      closeUploadModal();
      fetchAssets();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Upload failed';
      setJsonValidationError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const isUploadDisabled =
    isUploading ||
    !coordinatesInput.trim() ||
    !validateJson(coordinatesInput).isValid;

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
            <span className="loading-text">Loading assets…</span>
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
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span>/</span>
          <span>{appName || 'Apps'}</span>
          <span>/</span>
          <span>{categoryName || 'Categories'}</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>{categoryName || 'Assets'}</h1>
          <p className="subtitle">View and manage assets in this category</p>
        </div>

        {/* Actions */}
        <div className="action-bar">
          <SearchBar 
            data={assets}
            searchKeys={['name', 'tag']}
            placeholder="Search assets by name or tags..."
            onResults={setFilteredAssets}
          />
          {canManage && (
            <div className="action-group">
              <button
                className="btn-ghost"
                onClick={() => navigate(`/add-existing-assets/${appId}/${categoryId}`)}
              >
                ➕ Add Existing
              </button>
              <button
                className="btn btn-accent"
                onClick={() => navigate(`/create-asset/${appId}/${categoryId}`)}
              >
                ✨ New Asset
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setSuccessMessage('');
                  setJsonValidationError('');
                  setIsUploadModalOpen(true);
                }}
              >
                Upload Coordinates
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="btn-ghost ms-auto" onClick={fetchAssets}>Retry</button>
          </div>
        )}
        {successMessage && <div className="success-alert mb-3">✅ {successMessage}</div>}

        {/* List */}
        {filteredAssets.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <p>{assets.length > 0 ? "No matching assets found." : "No assets yet. Upload your first asset to get started."}</p>
          </div>
        ) : (
          <div className="apps-grid stagger-list">
            {filteredAssets.map((asset) => (
              <CategoryItem
                key={asset._id}
                image={asset.thumbnail || asset.image}
                name={asset.name}
                onClick={() => openPreviewModal(asset)}
                onEdit={() => navigate(`/edit-asset/${appId}/${categoryId}/${asset._id}`)}
                onDelete={() => handleRemoveAsset(asset._id)}
                canManage={canManage}
                asset={true}
                tag={asset.tag}
                width={asset.width}
                height={asset.height}
                isEnable={asset.isEnable}
                isPremium={asset.isPremium}
              />
            ))}
          </div>
        )}
      </div>
      <CoordinatesUploadModal
        isOpen={isUploadModalOpen}
        jsonInput={coordinatesInput}
        onChange={handleCoordinatesChange}
        onClose={closeUploadModal}
        onUpload={handleUploadCoordinates}
        uploading={isUploading}
        validationError={jsonValidationError}
        placeholder={modalPlaceholder}
        isUploadDisabled={isUploadDisabled}
      />
      <AssetPreviewModal
        isOpen={isPreviewModalOpen}
        asset={selectedAsset}
        onClose={closePreviewModal}
      />
    </div>
  );
};

export default AssetsList;
