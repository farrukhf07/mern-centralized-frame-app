import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const AddExistingCategory = () => {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [allCategories, setAllCategories] = useState([]);
  const [existingCategoryIds, setExistingCategoryIds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allRes, appRes] = await Promise.all([
        fetch(API_ENDPOINTS.GET_ALL_CATEGORIES),
        fetch(API_ENDPOINTS.GET_APP_VIEW(appId))
      ]);
      
      const allData = await allRes.json();
      const appData = await appRes.json();

      if (!allRes.ok || !allData.success) {
        throw new Error(allData.message || 'Failed to fetch categories');
      }

      setAllCategories(allData.categories || []);
      
      if (appRes.ok && appData.success) {
        const existingCats = appData.categories || [];
        setExistingCategoryIds(existingCats.map(c => c._id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (categoryId) => {
    setSelected((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one category');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      // POST each selected category to the app
      const results = await Promise.allSettled(
        selected.map((categoryId) =>
          fetch(API_ENDPOINTS.ADD_EXISTING_CATEGORY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId, categoryId }),
          }).then((res) => res.json())
        )
      );

      const failures = results.filter(
        (r) => r.status === 'rejected' || !r.value?.success
      );

      if (failures.length > 0) {
        setError(`${failures.length} of ${selected.length} failed to link.`);
      } else {
        setSuccessMsg(`Successfully linked ${selected.length} categories!`);
        setTimeout(() => navigate(-1), 1200);
      }
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
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span>/</span>
          <span>Add Existing Categories</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>Add Existing Categories</h1>
          <p className="subtitle">Select categories to attach to this application</p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="error-alert mb-3">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert mb-3">✅ {successMsg}</div>
        )}

        {/* Category checklist */}
        {allCategories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No categories exist yet. Create one first.</p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-center">
              <div className="stagger-list w-100" style={{ maxWidth: '600px' }}>
                {allCategories.map((cat) => {
                  const isAlreadyLinked = existingCategoryIds.includes(cat._id);
                  const isSelected = selected.includes(cat._id);
                  
                  return (
                  <div
                    key={cat._id}
                    className={`checkbox-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isAlreadyLinked && toggleSelect(cat._id)}
                    style={isAlreadyLinked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAlreadyLinked || isSelected}
                      disabled={isAlreadyLinked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => !isAlreadyLinked && toggleSelect(cat._id)}
                    />
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    {isAlreadyLinked && (
                      <span className="ms-auto" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Already Linked
                      </span>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="d-flex justify-content-center">
              <div className="mt-4 w-100" style={{ maxWidth: '600px' }}>
                <button
                  className="btn btn-accent w-100"
                  onClick={handleSubmit}
                  disabled={submitting || selected.length === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Linking…
                    </>
                  ) : (
                    `Link ${selected.length} Selected`
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddExistingCategory;
