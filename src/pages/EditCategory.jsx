import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const EditCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    isEnable: false,
    isPremium: false,
    sequence: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoryDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.GET_CATEGORY_BY_ID(categoryId));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch category details');
      }

      const category = data.category;
      setForm({
        name: category.name || '',
        isEnable: category.isEnable || false,
        isPremium: category.isPremium || false,
        sequence: category.sequence || 0,
      });

      if (category.thumbnail || category.image) {
        setImagePreview(category.thumbnail || category.image);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
      formData.append('isEnable', form.isEnable.toString());
      formData.append('isPremium', form.isPremium.toString());
      formData.append('sequence', form.sequence);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_CATEGORY(categoryId), {
        method: 'POST', // Backend route uses POST for update
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update category');
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
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Loading category details…</span>
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
          <span>Edit Category</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>✏️ Edit Category</h1>
          <p className="subtitle">Update the configuration of this category</p>
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
                placeholder="e.g. Backgrounds"
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
                  Updating…
                </>
              ) : (
                'Update Category'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCategory;
