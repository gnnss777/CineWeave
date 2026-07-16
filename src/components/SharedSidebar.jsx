import React, { useState, useMemo } from 'react';
import { User, MapPin, FileText, Sparkle, Target, Film, MessageSquare, Globe, Heart, Layers, Search, Edit, Trash2, Send, Compass, Plus, X, ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';

const SIDEBAR_TABS = {
  characters: { label: 'Personagens', icon: User },
  locations: { label: 'Locacoes', icon: MapPin },
  objects: { label: 'Objetos', icon: FileText },
  brainstorm: { label: 'Brainstorm', icon: Sparkle },
  scenes: { label: 'Cenas', icon: Film },
  plot_points: { label: 'Plot Points', icon: Target },
  themes: { label: 'Temas', icon: Heart },
  acts: { label: 'Atos', icon: Layers },
  outliner: { label: 'Cenas', icon: Film },
};

const BRAINSTORM_CATEGORIES = [
  { id: 'plot_points', label: 'Enredo', icon: Target, color: 'var(--primary-gold)' },
  { id: 'scenes', label: 'Cena', icon: Film, color: 'var(--color-act)' },
  { id: 'dialogues', label: 'Dialogo', icon: MessageSquare, color: 'var(--color-object)' },
  { id: 'world_elements', label: 'Mundo', icon: Globe, color: 'var(--color-location)' },
  { id: 'themes', label: 'Tema', icon: Heart, color: '#ec4899' },
];

const AVATARS = ['amber', 'purple', 'red', 'green', 'blue', 'pink'];
const getAvatarLetter = (name) => (name || '?')[0].toUpperCase();
const getAvatarColor = (avatar) => {
  const colors = { amber: '#d4a359', purple: '#a78bfa', red: '#ef4444', green: '#34d399', blue: '#60a5fa', pink: '#f472b6' };
  return colors[avatar] || colors.amber;
};

function TagChip({ tag }) {
  return <span className="trait-tag text-[10px] px-1.5 py-0.5">{tag}</span>;
}

function AvatarCircle({ item, type, size = 32 }) {
  if (type === 'character') {
    const color = getAvatarColor(item?.avatar);
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: '#000', flexShrink: 0 }}>
        {getAvatarLetter(item?.name)}
      </div>
    );
  }
  const Icon = type === 'location' ? MapPin : FileText;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={size * 0.5} style={{ color: type === 'location' ? 'var(--color-location)' : 'var(--color-object)' }} />
    </div>
  );
}

function SidebarCard({ item, type, tags, secondary, actions, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div className="sidebar-card" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: onClick ? 'pointer' : 'default', padding: '8px 10px', minHeight: 0, borderRadius: 10, background: hover ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
      <AvatarCircle item={item} type={type} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || item.title || item.statement || item.label || 'Sem nome'}</span>
          {secondary && <span style={{ fontSize: 9, color: '#ccee00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{typeof secondary === 'string' ? secondary.substring(0, 60) : secondary}</span>}
        </div>
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
            {tags.slice(0, 2).map((t, i) => <TagChip key={i} tag={t} />)}
            {tags.length > 2 && <span className="trait-tag" style={{ fontSize: 9, padding: '0 5px', borderRadius: 4, background: 'rgba(204,238,0,0.08)', border: '1px solid rgba(204,238,0,0.15)', color: '#ccee00' }}>+{tags.length - 2}</span>}
          </div>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 1, opacity: hover ? 1 : 0, transition: 'opacity 0.15s ease', flexShrink: 0 }}>
        {actions}
      </div>
    </div>
  );
}

export default function SharedSidebar({
  currentProject,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onSendToMap,
  onSendToScript,
  onSelectItem,
  tabContext,
  open,
  onToggle,
  extraTabs,
  extraTabData,
  outlinerData,
  onOutlinerSelect,
  position = 'right',
  onPositionToggle,
}) {
  const [search, setSearch] = useState('');
  const [bsCat, setBsCat] = useState('all');

  const baseKeys = tabContext === 'encyclopedia'
    ? ['characters', 'locations', 'objects', 'scenes', 'plot_points', 'themes', 'acts']
    : ['characters', 'locations', 'objects', 'scenes', 'plot_points', 'themes', 'acts', 'brainstorm', 'outliner'];
  const tabKeys = [...baseKeys, ...(extraTabs || []).map(t => t.id)];

  const characters = currentProject?.characters || [];
  const locations = currentProject?.locations || [];
  const objects = currentProject?.objects || [];
  const entities = currentProject?.entities || {};
  const allScenes = entities.scenes || [];
  const allPlotPoints = entities.plot_points || [];
  const allThemes = entities.themes || [];
  const allActs = entities.acts || [];
  const allDialogues = entities.dialogues || [];
  const allWorldElements = entities.world_elements || [];

  const brainstormItems = useMemo(() => {
    const items = [
      ...(allPlotPoints.map(p => ({ ...p, _bsCategory: 'plot_points' }))),
      ...(allScenes.map(s => ({ ...s, _bsCategory: 'scenes' }))),
      ...(allDialogues.map(d => ({ ...d, _bsCategory: 'dialogues' }))),
      ...(allWorldElements.map(w => ({ ...w, _bsCategory: 'world_elements' }))),
      ...(allThemes.map(t => ({ ...t, _bsCategory: 'themes' }))),
    ];
    if (bsCat === 'all') return items;
    return items.filter(item => item._bsCategory === bsCat);
  }, [allPlotPoints, allScenes, allDialogues, allWorldElements, allThemes, bsCat]);

  const filteredCharacters = useMemo(() => {
    if (!search) return characters;
    const q = search.toLowerCase();
    return characters.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || (c.traits || []).some(t => t.toLowerCase().includes(q)));
  }, [characters, search]);

  const filteredLocations = useMemo(() => {
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter(l => l.name?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q));
  }, [locations, search]);

  const filteredObjects = useMemo(() => {
    if (!search) return objects;
    const q = search.toLowerCase();
    return objects.filter(o => o.name?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q));
  }, [objects, search]);

  const filteredScenes = useMemo(() => {
    if (!search) return allScenes;
    const q = search.toLowerCase();
    return allScenes.filter(s => s.title?.toLowerCase().includes(q) || s.synopsis?.toLowerCase().includes(q));
  }, [allScenes, search]);

  const filteredPlotPoints = useMemo(() => {
    if (!search) return allPlotPoints;
    const q = search.toLowerCase();
    return allPlotPoints.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [allPlotPoints, search]);

  const filteredThemes = useMemo(() => {
    if (!search) return allThemes;
    const q = search.toLowerCase();
    return allThemes.filter(t => t.statement?.toLowerCase().includes(q) || t.evidence?.toLowerCase().includes(q));
  }, [allThemes, search]);

  const filteredActs = useMemo(() => {
    if (!search) return allActs;
    const q = search.toLowerCase();
    return allActs.filter(a => a.name?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
  }, [allActs, search]);

  const filteredBrainstorm = useMemo(() => {
    if (!search) return brainstormItems;
    const q = search.toLowerCase();
    return brainstormItems.filter(item =>
      (item.name || item.title || item.statement || '').toLowerCase().includes(q) ||
      (item.description || item.evidence || item.context || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [brainstormItems, search]);

  const outlinerItems = useMemo(() => {
    if (outlinerData) return outlinerData;
    return (currentProject?.screenplay || []).filter(el => el.type === 'scene-heading');
  }, [currentProject?.screenplay, outlinerData]);

  if (!open) {
    return (
      <div className="reference-sidebar-toggle" style={{ position: 'absolute', [position === 'left' ? 'left' : 'right']: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <button onClick={onToggle} className={`btn-secondary py-2 px-1 text-xs ${position === 'left' ? 'rounded-r-lg rounded-l-none' : 'rounded-l-lg rounded-r-none'}`} title="Abrir painel">
          <Compass size={16} />
        </button>
      </div>
    );
  }

  const listItems = () => {
    switch (activeTab) {
      case 'characters':
        return filteredCharacters.map(char => (
          <SidebarCard
            key={char.id}
            item={char}
            type="character"
            tags={char.traits}
            secondary={char.role}
            onClick={() => onSelectItem?.(char, 'character')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(char, 'character')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(char, 'character')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'locations':
        return filteredLocations.map(loc => (
          <SidebarCard
            key={loc.id}
            item={loc}
            type="location"
            tags={[]}
            secondary={`${loc.type || 'EXT.'} • ${loc.timeOfDay || ''}`}
            onClick={() => onSelectItem?.(loc, 'location')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(loc, 'location')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(loc, 'location')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'objects':
        return filteredObjects.map(obj => (
          <SidebarCard
            key={obj.id}
            item={obj}
            type="object"
            tags={[]}
            secondary={obj.significance ? obj.significance.substring(0, 50) : ''}
            onClick={() => onSelectItem?.(obj, 'object')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(obj, 'object')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(obj, 'object')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'brainstorm': {
        const items = filteredBrainstorm;
        return (
          <>
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-white/5">
              <button className={`text-[10px] px-2 py-0.5 rounded-full ${bsCat === 'all' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-white/5 text-gray-400'}`} onClick={() => setBsCat('all')}>Todas</button>
              {BRAINSTORM_CATEGORIES.map(cat => (
                <button key={cat.id} className={`text-[10px] px-2 py-0.5 rounded-full ${bsCat === cat.id ? 'bg-yellow-600/30 text-yellow-400' : 'bg-white/5 text-gray-400'}`} onClick={() => setBsCat(cat.id)}>
                  {cat.label}
                </button>
              ))}
            </div>
            {items.length === 0 && <p className="text-xs text-gray-500 px-3 py-4 text-center">Nenhum item de brainstorm.</p>}
            {items.map((item, i) => {
              const catInfo = BRAINSTORM_CATEGORIES.find(c => c.id === item._bsCategory);
              return (
                <SidebarCard
                  key={item.id || `bs-${i}`}
                  item={item}
                  type={item._bsCategory === 'world_elements' ? 'location' : item._bsCategory === 'dialogues' ? 'character' : 'object'}
                  tags={item.tags || []}
                  secondary={catInfo?.label || item._bsCategory}
                  actions={
                    <>
                      {tabContext !== 'screenplay' && <button className="sidebar-action-btn" onClick={() => onSendToScript?.(item)} title="Enviar pro Roteiro"><Film size={13} /></button>}
                      {tabContext !== 'mindmap' && <button className="sidebar-action-btn" onClick={() => onSendToMap?.(item)} title="Enviar pro Mapa"><Send size={13} /></button>}
                      <button className="sidebar-action-btn" onClick={() => onEdit?.(item, 'brainstorm')} title="Editar"><Edit size={13} /></button>
                      <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(item, 'brainstorm')} title="Excluir"><Trash2 size={13} /></button>
                    </>
                  }
                />
              );
            })}
          </>
        );
      }
      case 'outliner':
        return outlinerItems.map((el, i) => (
          <div key={el.id || i} onClick={() => onOutlinerSelect ? onOutlinerSelect(el) : onSelectItem?.(el, 'scene')}
            style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-act)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: '#f59e0b', marginRight: 4 }}>#{el.sceneNumber || i + 1}</span>
              {el.cleanText || el.text || el.name || el.title || ''}
            </span>
          </div>
        ));
      case 'scenes':
        return filteredScenes.map((scene, idx) => (
          <SidebarCard
            key={scene.id}
            item={scene}
            type="scene"
            tags={[]}
            secondary={`#${scene.order !== undefined ? scene.order + 1 : idx + 1}${scene.synopsis ? ' · ' + scene.synopsis.substring(0, 50) : ''}`}
            onClick={() => onSelectItem?.(scene, 'scene')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(scene, 'scene')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(scene, 'scene')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'plot_points':
        return filteredPlotPoints.map(pp => (
          <SidebarCard
            key={pp.id}
            item={pp}
            type="plot_point"
            tags={pp.tags || []}
            secondary={pp.description ? pp.description.substring(0, 60) : ''}
            onClick={() => onSelectItem?.(pp, 'plot_point')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(pp, 'plot_point')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(pp, 'plot_point')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'themes':
        return filteredThemes.map(theme => (
          <SidebarCard
            key={theme.id}
            item={theme}
            type="theme"
            tags={theme.tags || []}
            secondary={theme.statement ? theme.statement.substring(0, 60) : ''}
            onClick={() => onSelectItem?.(theme, 'theme')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(theme, 'theme')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(theme, 'theme')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      case 'acts':
        return filteredActs.map(act => (
          <SidebarCard
            key={act.id}
            item={act}
            type="act"
            tags={[]}
            secondary={act.description ? act.description.substring(0, 60) : ''}
            onClick={() => onSelectItem?.(act, 'act')}
            actions={
              <>
                <button className="sidebar-action-btn" onClick={() => onEdit?.(act, 'act')} title="Editar"><Edit size={13} /></button>
                <button className="sidebar-action-btn text-red-400" onClick={() => onDelete?.(act, 'act')} title="Excluir"><Trash2 size={13} /></button>
              </>
            }
          />
        ));
      default: {
        const extra = (extraTabs || []).find(t => t.id === activeTab);
        if (extra) return extra.render?.(extraTabData);
        return null;
      }
    }
  };

  return (
    <div className="reference-sidebar open" style={{ width: '320px', minWidth: '320px', borderLeft: position === 'right' ? '1px solid rgba(255,255,255,0.06)' : 'none', borderRight: position === 'left' ? '1px solid rgba(255,255,255,0.06)' : 'none', backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', order: position === 'left' ? -1 : 0 }}>
      <div className="sidebar-drag-handle" />
      <div className="reference-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div className="reference-tabs" style={{ display: 'flex', gap: '1px', overflow: 'hidden', flex: 1 }}>
          {tabKeys.map(key => {
            const tab = SIDEBAR_TABS[key];
            const extra = (extraTabs || []).find(t => t.id === key);
            if (!tab && !extra) return null;
            const Icon = tab?.icon || extra?.icon;
            const label = tab?.label || extra?.label;
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => onTabChange(key)} title={label} className={`reference-tab ${isActive ? 'active' : ''}`}
                style={{ padding: '5px 7px', fontSize: '10px', fontWeight: isActive ? 700 : 500, borderRadius: '6px', border: 'none', background: isActive ? 'rgba(204, 238, 0, 0.15)' : 'transparent', color: isActive ? '#ccee00' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        <button onClick={onToggle} className="reference-toggle-close" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px', flexShrink: 0 }} title="Fechar painel">
          <X size={12} />
        </button>
        {onPositionToggle && (
          <button onClick={onPositionToggle} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px', flexShrink: 0 }} title={position === 'right' ? 'Mover para esquerda' : 'Mover para direita'}>
            {position === 'right' ? <ArrowRightFromLine size={12} /> : <ArrowLeftFromLine size={12} />}
          </button>
        )}
      </div>

      <div style={{ padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={10} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-black/40 border border-white/10 rounded text-xs text-white py-1 pl-6 pr-2 focus:outline-none focus:border-yellow-600" style={{ fontSize: 10 }} />
        </div>
      </div>

      <div className="reference-sidebar-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 0' }}>
        {listItems()}
      </div>

      {['characters', 'locations', 'objects', 'scenes', 'plot_points', 'themes', 'acts'].includes(activeTab) && (
        <div style={{ padding: '4px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => onEdit?.(null, activeTab === 'characters' ? 'character' : activeTab === 'locations' ? 'location' : activeTab === 'objects' ? 'object' : activeTab === 'scenes' ? 'scene' : activeTab === 'plot_points' ? 'plot_point' : activeTab === 'themes' ? 'theme' : 'act')}
            className="btn-primary w-full py-1 text-xs font-bold flex items-center justify-center gap-1" style={{ fontSize: 10 }}>
            <Plus size={10} /> Novo
          </button>
        </div>
      )}
    </div>
  );
}
