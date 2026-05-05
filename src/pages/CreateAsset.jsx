import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../apiEndpoints/endpoints';

const CreateAsset = () => {
  const { appId, categoryId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    isPremium: false,
    isEnable: false,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [existingAssetNames, setExistingAssetNames] = useState([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [nonDuplicateFiles, setNonDuplicateFiles] = useState([]);

  useEffect(() => {
    const fetchExistingAssets = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.GET_ASSETS_LIST);
        const data = await res.json();
        if (res.ok && data.success) {
          setExistingAssetNames(data.assets.map(a => a.name.toLowerCase()));
        }
      } catch (err) {
        console.error("Failed to fetch existing assets", err);
      }
    };
    fetchExistingAssets();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.GET_CATEGORY_BY_ID(categoryId));
        const data = await res.json();
        if (res.ok && data.success) {
          setCategoryName(data.category.name);
        }
      } catch (err) {
        console.error("Failed to fetch category", err);
      }
    };
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const handleChange = (e) => {
    const { name, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : e.target.value,
    }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 25) {
      setError('Maximum 25 images allowed');
      return;
    }
    setImageFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setError(null);
  };

  const validate = () => {
    if (imageFiles.length === 0) return 'Please select at least one image';
    return null;
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

  const splitFileName = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return { base: filename, ext: '' };
    return {
      base: filename.substring(0, lastDotIndex),
      ext: filename.substring(lastDotIndex)
    };
  };

  const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9-_]/g, "_");

  const processUploadFiles = (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const duplicates = [];
    const nonDuplicates = [];
    const currentBatchNames = new Set();

    imageFiles.forEach(file => {
      const { base, ext } = splitFileName(file.name);
      const sanitizedBase = sanitizeName(base).toLowerCase();
      
      if (existingAssetNames.includes(sanitizedBase) || currentBatchNames.has(sanitizedBase)) {
        let count = 1;
        let suggestedBase = `${sanitizedBase}_${count}`;
        while (existingAssetNames.includes(suggestedBase) || currentBatchNames.has(suggestedBase)) {
          count++;
          suggestedBase = `${sanitizedBase}_${count}`;
        }
        
        duplicates.push({
          originalFile: file,
          originalName: file.name,
          baseName: sanitizeName(base),
          ext: ext,
          newName: suggestedBase + ext,
          suggestedBase: suggestedBase,
          previewUrl: URL.createObjectURL(file)
        });
        currentBatchNames.add(suggestedBase);
      } else {
        nonDuplicates.push(file);
        currentBatchNames.add(sanitizedBase);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      setNonDuplicateFiles(nonDuplicates);
      setShowRenameModal(true);
    } else {
      executeUpload(imageFiles);
    }
  };

  const handleRenameChange = (index, newNameVal) => {
    const updated = [...duplicateFiles];
    updated[index].newName = newNameVal;
    setDuplicateFiles(updated);
  };

  const handleApplyRename = () => {
    const finalFiles = [...nonDuplicateFiles];
    for (let i = 0; i < duplicateFiles.length; i++) {
      const item = duplicateFiles[i];
      const renamedFile = new File([item.originalFile], item.newName, { type: item.originalFile.type });
      finalFiles.push(renamedFile);
    }
    setShowRenameModal(false);
    executeUpload(finalFiles);
  };

  const executeUpload = async (filesToUpload) => {
    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('isPremium', JSON.stringify(form.isPremium));
      formData.append('isEnable', JSON.stringify(form.isEnable));
      formData.append("tag", JSON.stringify(tags));

      if (appId) {
        formData.append('appId', appId);
        formData.append('categoryName', categoryName);
      }

      filesToUpload.forEach((file) => {
        formData.append('image', file);
      });

      const endpoint = API_ENDPOINTS.CREATE_ASSET_AND_LINK;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create asset');
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
          <span>New Asset</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <h1>🖼️ Upload Assets</h1>
          <p className="subtitle">Upload one or more images to this category (max 25)</p>
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
        <form className="glass-form w-100" onSubmit={processUploadFiles}>
          {/* Category Name */}
          <div className="mb-3">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-control"
              name="categoryName"
              value={categoryName}
              disabled
            />
          </div>

          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label">Images *</label>
            <div
              className="file-drop-zone"
              onClick={() => fileRef.current?.click()}
            >
              {previews.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {previews.slice(0, 8).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Preview ${i + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                  {previews.length > 8 && (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 8,
                        background: 'rgba(139,92,246,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#a78bfa',
                      }}
                    >
                      +{previews.length - 8}
                    </div>
                  )}
                </div>
              ) : (
                <span>📁 Click to select images (multiple allowed)</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
              />
            </div>
            {imageFiles.length > 0 && (
              <div className="card-meta mt-1">
                {imageFiles.length} file{imageFiles.length > 1 ? 's' : ''} selected
              </div>
            )}
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

          {/* Toggles */}
          <div className="d-flex gap-4 mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="asset-enable"
                name="isEnable"
                checked={form.isEnable}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="asset-enable">
                Enabled
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="asset-premium"
                name="isPremium"
                checked={form.isPremium}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="asset-premium">
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
                Uploading…
              </>
            ) : (
              `Upload ${imageFiles.length || ''} Asset${imageFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </form>
        </div>

      </div>

      {showRenameModal && createPortal(
        <div className="theme-modal-overlay open" style={{ zIndex: 9999 }}>
          <div className="theme-modal-card open" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="theme-modal-body p-4">
              <h3 className="mb-3">Duplicate Files Detected</h3>
              <p className="text-muted mb-4">
                Some files have names that conflict with existing assets or other files in this batch. 
                Please rename them to continue.
              </p>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {duplicateFiles.map((dup, index) => (
                  <div key={index} className="mb-3 p-3" style={{ background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={dup.previewUrl} 
                        alt="preview" 
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} 
                      />
                      <div className="flex-grow-1">
                        <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Original: {dup.originalName}</div>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={dup.newName} 
                          onChange={(e) => handleRenameChange(index, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="d-flex gap-3 mt-4">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-grow-1" 
                  onClick={() => setShowRenameModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-accent flex-grow-1" 
                  onClick={handleApplyRename}
                >
                  Apply Rename & Upload
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CreateAsset;
