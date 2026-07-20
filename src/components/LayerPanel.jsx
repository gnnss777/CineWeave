import React from 'react';

export default function LayerPanel({ layers, activeLayerId, onToggleLayer, onSelectLayer, onAddLayer }) {
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const getLayerTypeIcon = (type) => {
    switch (type) {
      case 'drawing':
        return '🎨';
      case 'text':
        return 'T';
      case 'image':
        return '🖼️';
      case 'background':
        return '⬛';
      default:
        return '📄';
    }
  };

  const getLayerTypeColor = (type) => {
    switch (type) {
      case 'drawing':
        return 'var(--color-act)';
      case 'text':
        return 'var(--color-scene)';
      case 'image':
        return 'var(--color-theme)';
      case 'background':
        return 'var(--color-location)';
      default:
        return 'var(--text-muted)';
    }
  };

  return (
    <div className="layer-panel">
      <div className="layer-header">
        <h3>Layers</h3>
        <button onClick={onAddLayer} className="btn-add-layer">
          <span>+</span> Add Layer
        </button>
      </div>

      <div className="layer-list">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
            onClick={() => onSelectLayer(layer.id)}
          >
            <div
              className="layer-visibility"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLayer(layer.id);
              }}
            >
              <span className="visibility-icon">
                {layer.visible ? '👁️' : '🚫'}
              </span>
            </div>

            <div
              className="layer-thumbnail"
              style={{
                backgroundColor: getLayerTypeColor(layer.type),
              }}
            >
              {getLayerTypeIcon(layer.type)}
            </div>

            <div className="layer-info">
              <span className="layer-name">{layer.name}</span>
              <span className="layer-type">{layer.type}</span>
            </div>

            <div className="layer-lock">
              {layer.locked && <span className="lock-icon">🔒</span>}
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="empty-layer-state">
          <p>No layers yet</p>
          <button onClick={onAddLayer} className="btn-add-layer-small">
            Add First Layer
          </button>
        </div>
      )}
    </div>
  );
}
