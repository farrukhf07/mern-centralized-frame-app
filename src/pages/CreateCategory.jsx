import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const CreateCategory = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    isEnable: false,
    isPremium: false,
    sequence: 0,
  });
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(appId || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!appId) {
      fetchApps();
    }
  }, [appId]);

  const fetchApps = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_ALL_APPS);
      const data = await response.json();
      if (data.success) {
        setApps(data.apps || []);
        if (data.apps?.length > 0) {
          setSelectedAppId(data.apps[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch apps", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'selectedAppId') {
      setSelectedAppId(value);
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (!form.name.trim()) return 'Category name is required';
    if (!selectedAppId) return 'Please select an application';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('isEnable', form.isEnable);
      formData.append('isPremium', form.isPremium);
      formData.append('sequence', form.sequence);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(API_ENDPOINTS.CREATE_APP_CATEGORY(selectedAppId), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create category');
      }

      navigate(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="container-fluid">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span>/</span>
          <span>New Category</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>✨ Create Category</h1>
          <p className="subtitle">Add a new category to this application</p>
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
        <form className="glass-form w-100" onSubmit={handleSubmit}>
          {/* Application Selection (if global) */}
          {!appId && (
            <div className="mb-3">
              <label className="form-label">Link to Application *</label>
              <select
                name="selectedAppId"
                className="form-select"
                value={selectedAppId}
                onChange={handleChange}
                required
              >
                <option value="" style={{ color: 'black' }}>Select App</option>
                {apps.map(app => (
                  <option key={app._id} value={app._id} style={{ color: 'black' }}>{app.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name */}
          <div className="mb-3">
            <label className="form-label" htmlFor="cat-name">
              Category Name *
            </label>
            <input
              id="cat-name"
              type="text"
              className="form-control"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label">Cover Image</label>
            <div
              className="file-drop-zone"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 160,
                    borderRadius: 8,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span>📁 Click to select an image</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
              />
            </div>
          </div>

          {/* Sequence */}
          <div className="mb-3">
            <label className="form-label" htmlFor="cat-seq">
              Sequence
            </label>
            <input
              id="cat-seq"
              type="number"
              className="form-control"
              name="sequence"
              value={form.sequence}
              onChange={handleChange}
              min={0}
            />
          </div>

          {/* Toggles */}
          <div className="d-flex gap-4 mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="cat-enable"
                name="isEnable"
                checked={form.isEnable}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="cat-enable">
                Enabled
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="cat-premium"
                name="isPremium"
                checked={form.isPremium}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="cat-premium">
                Premium
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-accent w-100"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creating…
              </>
            ) : (
              'Create Category'
            )}
          </button>
        </form>
        </div>

      </div>
    </div>
  );
};

export default CreateCategory;
