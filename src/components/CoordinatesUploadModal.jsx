import React from 'react';
import { createPortal } from 'react-dom';

const CoordinatesUploadModal = ({
  isOpen,
  jsonInput,
  onChange,
  onClose,
  onUpload,
  uploading,
  validationError,
  placeholder,
  isUploadDisabled,
}) => {
  return createPortal(
    <div
      className={`theme-modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        className={`theme-modal-card ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Upload Coordinates"
      >
        <button
          type="button"
          className="theme-modal-close btn-sm-icon"
          onClick={onClose}
          aria-label="Close"
        >
          X
        </button>

        <div className="theme-modal-body">
          <textarea
            className="theme-json-textarea"
            placeholder={placeholder}
            value={jsonInput}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
          />
          {validationError && <div className="error-alert mt-2">{validationError}</div>}
        </div>

        <div className="theme-modal-footer">
          <button
            type="button"
            className="btn btn-accent"
            onClick={onUpload}
            disabled={isUploadDisabled}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CoordinatesUploadModal;
