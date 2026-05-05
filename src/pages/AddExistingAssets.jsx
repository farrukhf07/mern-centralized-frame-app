import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const AddExistingAssets = () => {
  const { appId, categoryId } = useParams();
  const navigate = useNavigate();

  const [allAssets, setAllAssets] = useState([]);
  const [existingAssetIds, setExistingAssetIds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Get all assets for this category from Master table
      // 2. Get current app view to see which assets are already linked
      const [allRes, appViewRes] = await Promise.all([
        fetch(API_ENDPOINTS.GET_ASSETS_OF_CATEGORY(categoryId)),
        fetch(API_ENDPOINTS.GET_APP_VIEW(appId))
      ]);
      
      const allData = await allRes.json();
      const appViewData = await appViewRes.json();

      if (!allRes.ok || !allData.success) {
        throw new Error(allData.message || 'Failed to fetch master assets');
      }

      setAllAssets(allData.assets || []);
      if (allData.categoryName) setCategoryName(allData.categoryName);
      
      if (appViewRes.ok && appViewData.success) {
        const currentCat = appViewData.categories.find(c => c._id === categoryId);
        if (currentCat) {
          // Store IDs of assets already in this app's category view
          setExistingAssetIds((currentCat.assets || []).map(a => a._id));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (assetId) => {
    setSelected((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one asset');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const response = await fetch(API_ENDPOINTS.ADD_EXISTING_ASSETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, categoryId, assetIds: selected }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to link assets');
      }

      setSuccessMsg(`Successfully linked ${selected.length} assets!`);
      setTimeout(() => navigate(-1), 1200);
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
          <span>Add Existing Assets</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>Add Existing Assets</h1>
          <p className="subtitle">Select assets from {categoryName || 'this category'} to link to this app</p>
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

        {/* Asset checklist */}
        {allAssets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🖼️</div>
            <p>No assets found in master for this category.</p>
          </div>
        ) : (
          <>
            <div className="stagger-list" style={{ maxWidth: '800px' }}>
              <div className="row g-3">
                {allAssets.map((asset) => {
                  const isAlreadyLinked = existingAssetIds.includes(asset._id);
                  const isSelected = selected.includes(asset._id);
                  
                  return (
                    <div key={asset._id} className="col-md-6 col-lg-4">
                      <div
                        className={`checkbox-list-item h-100 ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isAlreadyLinked && toggleSelect(asset._id)}
                        style={isAlreadyLinked ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isAlreadyLinked || isSelected}
                          disabled={isAlreadyLinked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => !isAlreadyLinked && toggleSelect(asset._id)}
                        />
                        <img
                          src={asset.thumbnail || asset.image}
                          alt={asset.name}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 8,
                            objectFit: 'cover',
                            marginLeft: '10px'
                          }}
                        />
                        <div className="ms-2 flex-grow-1">
                          <div style={{ fontWeight: 500, fontSize: '0.9rem' }} className="text-truncate">
                            {asset.name}
                          </div>
                          {isAlreadyLinked && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Already Linked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-4" style={{ maxWidth: '300px' }}>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AddExistingAssets;
