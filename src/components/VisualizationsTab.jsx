import React, { useState } from 'react';
import { Compass, LayoutGrid, Clock } from 'lucide-react';

// Lazy load sub-components
const MindMapTab = React.lazy(() => import('./MindMapTab'));
const CorkboardTab = React.lazy(() => import('./CorkboardTab'));
const TimelineTab = React.lazy(() => import('./TimelineTab'));

function VisualizationLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7c7c82', gap: '12px', fontSize: '13px' }}>
      <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--primary-gold)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      <span>Carregando visualização...</span>
    </div>
  );
}

function VisualizationsTab() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('cineweave_viz_view') || 'mindmap';
  });

  const views = [
    { key: 'mindmap', label: 'Mapa Mental', icon: Compass },
    { key: 'corkboard', label: 'Corkboard', icon: LayoutGrid },
    { key: 'timeline', label: 'Timeline', icon: Clock },
  ];

  const handleViewChange = (key) => {
    setView(key);
    localStorage.setItem('cineweave_viz_view', key);
  };

  const renderView = () => {
    switch (view) {
      case 'mindmap': return <MindMapTab />;
      case 'corkboard': return <CorkboardTab />;
      case 'timeline': return <TimelineTab />;
      default: return <MindMapTab />;
    }
  };

  return (
    <div className="tab-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-nav header */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => handleViewChange(v.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: view === v.key ? 'var(--primary-gold)' : 'transparent',
              color: view === v.key ? '#050505' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: view === v.key ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            <v.icon size={16} />
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <React.Suspense fallback={<VisualizationLoader />}>
          {renderView()}
        </React.Suspense>
      </div>
    </div>
  );
}

export default VisualizationsTab;
