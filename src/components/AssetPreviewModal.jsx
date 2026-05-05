import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const AssetPreviewModal = ({ isOpen, asset, onClose }) => {
  const imageRef = useRef(null);
  const [imgSize, setImgSize] = useState({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  });

  const coordinates = useMemo(() => {
    if (!asset?.coordinates || !Array.isArray(asset.coordinates)) return [];
    return asset.coordinates;
  }, [asset]);

  const updateImageSize = () => {
    const img = imageRef.current;
    if (!img) return;
    setImgSize({
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      renderedWidth: img.clientWidth || 0,
      renderedHeight: img.clientHeight || 0,
    });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleResize = () => updateImageSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const canRenderBoxes = imgSize.naturalWidth > 0 && coordinates.length > 0;

  return createPortal(
    <div
      className={`theme-modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        className={`theme-modal-card asset-preview-modal ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Asset Preview"
      >
        <button
          type="button"
          className="theme-modal-close btn-sm-icon"
          onClick={onClose}
          aria-label="Close"
        >
          X
        </button>

        <div className="theme-modal-body pt-0">
          <div className="asset-preview-header">
            <h3>{asset?.name || 'Asset Preview'}</h3>
          </div>

          <div className="asset-preview-image-wrap">
            {asset?.image ? (
              <div className="asset-preview-image-stage" style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={asset.image}
                  alt={asset?.name || 'Asset'}
                  className="asset-preview-image"
                  style={{ display: 'block', maxWidth: '100%' }}
                  onLoad={updateImageSize}
                />

                {canRenderBoxes &&
                  coordinates.map((box, index) => {
                    // Logic rebuilt from Old File:
                    // Using (coordinate / naturalDimension) * 100 to get percentage
                    const widthPct = (toNumber(box.width) / imgSize.naturalWidth) * 100;
                    const heightPct = (toNumber(box.height) / imgSize.naturalHeight) * 100;
                    
                    // Centering logic: (CenterPoint - HalfWidth) / TotalWidth
                    const leftPct = ((toNumber(box.x) - toNumber(box.width) / 2) / imgSize.naturalWidth) * 100;
                    const topPct = ((toNumber(box.y) - toNumber(box.height) / 2) / imgSize.naturalHeight) * 100;

                    return (
                      <div
                        key={`${box.name || 'frame'}-${index}`}
                        className="asset-box"
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          transform: `rotate(${box.rotation || 0}deg)`,
                          transformOrigin: "center center",
                          pointerEvents: "none",
                          border: "2px solid red", // Ensure visibility
                        }}
                      >
                        
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🖼️</div>
                <p>No image available for preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AssetPreviewModal;
