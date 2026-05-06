import React, { useState } from 'react';

const CategoryItem = ({
  image,
  name,
  onEdit,
  onUpdate,
  onClick,
  onDelete,
  onHardDelete,
  asset,
  tag,
  width,
  height,
  isAddMode,
  isEnable = true,
  isPremium = false,
  canManage = true,
  canHardDelete = false,
  hardDeleteLoading = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // Replicating imageStyle from Old Component
  const imageStyle = {
    height: "140px",
    width: "100%",
    objectFit: "contain",
    backgroundColor: "var(--card-image-bg)",
    transition: "transform 0.3s ease",
    transform: isHovered ? "scale(1.05)" : "scale(1)",
    filter: 'brightness(0.95)',
    borderBottom: '1px solid var(--card-border-color)'
  };

  if (isAddMode) {
    return (
      <div
        className="category-item d-flex flex-column align-items-center justify-content-center"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        style={{
          height: '100%',
          minHeight: '220px',
          borderStyle: 'dashed',
          borderWidth: '2px',
          background: 'var(--bg-glass)',
          padding: 0,
          transition: "transform 0.25s ease",
          transform: isHovered ? "translateY(-6px)" : "none",
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.7 }}>➕</div>
        <div className="cat-name text-center" style={{ color: 'var(--text-secondary)' }}>
          {name || 'Add New'}
        </div>
      </div>
    );
  }

  return (
    <div
      className="category-item d-flex flex-column"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      style={{
        position: 'relative',
        padding: 0,
        overflow: 'hidden',
        height: '100%',
        minHeight: '220px',
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        transform: isHovered ? "translateY(-6px)" : "none",
        boxShadow: isHovered ? "0 18px 36px rgba(0,0,0,0.12)" : "none"
      }}
    >
      {/* Disabled Badge */}
      {!isEnable && (
        <span 
          className="position-absolute top-0 start-0 badge bg-danger shadow-sm"
          style={{
            zIndex: 10,
            fontSize: "0.75rem",
            padding: "0.4rem 0.6rem",
            borderRadius: "0 0 0.25rem 0",
            fontWeight: "600",
            letterSpacing: "0.5px"
          }}
        >
          Disabled
        </span>
      )}

      {/* Premium Badge */}
      {isPremium && (
        <span 
          className="position-absolute top-0 end-0 d-flex align-items-center justify-content-center shadow-sm"
          style={{
            zIndex: 10,
            width: "32px",
            height: "32px",
            background: "rgb(79, 70, 229)",
            borderRadius: "0 0 0 8px"
          }}
        >
          <span style={{ color: "white", fontSize: "16px" }}>✦</span>
        </span>
      )}
      {/* Image / Placeholder on Top */}
      <div
        style={{overflow: 'hidden',flexShrink: 0, position: 'relative' }}>
        {image ? (
          <img src={image} alt={name || 'Item'} style={imageStyle} />
        ) : (
          <div className="cat-placeholder" style={{ width: '64px', height: '64px', fontSize: '1.8rem', borderRadius: '50%' }}>
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        {asset && width && height && (
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.5)',
              padding: '2px 6px',
              borderRadius: '4px',
              lineHeight: 1
            }}
          >
            {width}×{height}
          </div>
        )}
      </div>

      {/* Body with title and buttons at bottom */}
      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="cat-info mb-3 text-center">
          <div className="cat-name m-0" style={{ whiteSpace: 'normal', fontSize: '1rem', fontWeight: 600 }}>
            {name || 'Untitled'}
          </div>
          {asset && (
            <div className="cat-detail mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {Array.isArray(tag) && tag.length > 0 ? tag.join(', ') : 'N/A'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="cat-actions mt-auto d-flex justify-content-center gap-2">
          {canManage && onEdit && (
            <button
              className="btn-sm-edit"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              Edit
            </button>
          )}
          {canManage && onUpdate && (
            <button
              className="btn-sm-icon"
              title="Update"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate();
              }}
            >
              🔄
            </button>
          )}
          {canManage && onDelete && (
            <button
              className="btn-sm-icon"
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              🗑️
            </button>
          )}
          {canHardDelete && onHardDelete && (
            <button
              className="btn-sm-delete"
              title="DELETE"
              disabled={hardDeleteLoading}
              onClick={(e) => {
                e.stopPropagation();
                onHardDelete();
              }}
            >
              {hardDeleteLoading ? 'DELETING...' : 'DELETE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryItem;
