import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const EditAsset = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    categoryName: '',
    name: '',
    isPremium: false,
    isEnable: false,
    coordinates: '',
    width: '',
    height: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchAssetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.GET_ASSET_BY_ID(assetId));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch asset');
      }

      const asset = data.asset;
      setForm({
        categoryName: asset.categoryName || '',
        name: asset.name || '',
        isPremium: !!asset.isPremium,
        isEnable: !!asset.isEnable,
        coordinates: asset.coordinates ? JSON.stringify(asset.coordinates) : '',
        width: asset.width || '',
        height: asset.height || '',
      });
      setTags(asset.tag || []);
      setPreview(asset.image || asset.thumbnail || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) return;
    setTags([...tags, value]);
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('isPremium', JSON.stringify(form.isPremium));
      formData.append('isEnable', JSON.stringify(form.isEnable));
      formData.append('coordinates', form.coordinates);
      formData.append('tag', JSON.stringify(tags));
      if (form.width !== '') formData.append('width', form.width);
      if (form.height !== '') formData.append('height', form.height);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_ASSET(assetId), {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update asset');
      }

      navigate(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper fade-in">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading asset details…</span>
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
          <span>Edit Asset</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>✏️ Edit Asset</h1>
          <p className="subtitle">Update asset details and image</p>
        </div>

        {/* Error */}
        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="d-flex justify-content-center">
          {/* Form */}
          <form className="glass-form" onSubmit={handleSubmit}>
            
            <div className="row g-4 mb-4">
              {/* Category Name (Disabled) */}
              <div className="col-md-6">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="categoryName"
                  value={form.categoryName}
                  disabled
                />
              </div>

              {/* Asset Name */}
              <div className="col-md-6">
                <label className="form-label">Asset Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter asset name"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="form-label">Asset Image</label>
              <div className="d-flex align-items-center gap-3">
                {preview ? (
                  <img
                    src={preview}
                    alt="Asset Preview"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid var(--border-glass)',
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      background: 'var(--bg-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    🖼️
                  </div>
                )}
                
                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose File
                  </button>
                  <div className="card-meta mt-1">Upload a new image to replace the current one</div>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleFile}
              />
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label className="form-label">Tags (optional)</label>

              {/* Selected Tags */}
              <div className="d-flex flex-wrap gap-2 mb-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "rgba(139,92,246,0.2)",
                      color: "#a78bfa",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    {tag}
                    <span
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>

              {/* Input */}
              <input
                type="text"
                className="form-control"
                placeholder="Type tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
              />
            </div>

            {/* Dimensions */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="form-label">Width (px)</label>
                <input
                  type="number"
                  className="form-control"
                  name="width"
                  value={form.width}
                  onChange={handleChange}
                  placeholder="Auto-calculated if blank"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Height (px)</label>
                <input
                  type="number"
                  className="form-control"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="Auto-calculated if blank"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="mb-4">
              <label className="form-label">Coordinates (JSON format)</label>
              <textarea
                className="form-control"
                name="coordinates"
                rows="3"
                value={form.coordinates}
                onChange={handleChange}
                placeholder='[{"x": 10, "y": 20}]'
              ></textarea>
            </div>

            {/* Toggles */}
            <div className="d-flex gap-4 mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="edit-asset-enable"
                  name="isEnable"
                  checked={form.isEnable}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="edit-asset-enable">
                  Enabled
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="edit-asset-premium"
                  name="isPremium"
                  checked={form.isPremium}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="edit-asset-premium">
                  Premium
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="d-flex gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary flex-grow-1"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent flex-grow-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating…
                  </>
                ) : (
                  'Update Asset'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAsset;
