import React, { useState, useMemo } from 'react';
import { User, MapPin, FileText, Sparkle, Target, Film, MessageSquare, Globe, Heart, Search, Edit, Trash2, Send, Compass, Plus, X } from 'lucide-react';

const SIDEBAR_TABS = {
  characters: { label: 'Personagens', icon: User },
  locations: { label: 'Locacoes', icon: MapPin },
  objects: { label: 'Objetos', icon: FileText },
  brainstorm: { label: 'Brainstorm', icon: Sparkle },
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
  return (
    <div className="sidebar-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="sidebar-card-left">
        <AvatarCircle item={item} type={type} />
        <div className="sidebar-card-info">
          <span className="sidebar-card-name">{item.name || item.title || item.statement || item.label || 'Sem nome'}</span>
          {secondary && <span className="sidebar-card-secondary">{secondary}</span>}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {tags.slice(0, 3).map((t, i) => <TagChip key={i} tag={t} />)}
              {tags.length > 3 && <span className="trait-tag text-[10px] px-1.5 py-0.5">+{tags.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="sidebar-card-actions" onClick={(e) => e.stopPropagation()}>
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
}) {
  const [search, setSearch] = useState('');
  const [bsCat, setBsCat] = useState('all');

  const baseKeys = tabContext === 'screenplay' ? ['characters', 'locations', 'objects', 'brainstorm', 'outliner'] : tabContext === 'encyclopedia' ? ['characters', 'locations', 'objects'] : ['characters', 'locations', 'objects', 'brainstorm'];
  const tabKeys = [...baseKeys, ...(extraTabs || []).map(t => t.id)];

  const characters = currentProject?.characters || [];
  const locations = currentProject?.locations || [];
  const objects = currentProject?.objects || [];
  const brainstormData = currentProject?.brainstormData || {};
  const screenplay = currentProject?.screenplay || [];

  const brainstormItems = useMemo(() => {
    if (bsCat === 'all') {
      return Object.entries(brainstormData).flatMap(([catId, items]) =>
        (items || []).map(item => ({ ...item, _bsCategory: catId }))
      );
    }
    return (brainstormData[bsCat] || []).map(item => ({ ...item, _bsCategory: bsCat }));
  }, [brainstormData, bsCat]);

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
    return screenplay.filter(el => el.type === 'scene-heading');
  }, [screenplay]);

  if (!open) {
    return (
      <div className="reference-sidebar-toggle" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <button onClick={onToggle} className="btn-secondary py-2 px-1 text-xs rounded-l-lg rounded-r-none" title="Abrir painel">
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
          <div key={el.id || i} className="sidebar-card" onClick={() => onSelectItem?.(el, 'scene')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-card-left">
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-act)', flexShrink: 0 }} />
              <div className="sidebar-card-info">
                <span className="sidebar-card-name">{el.text}</span>
              </div>
            </div>
          </div>
        ));
      default: {
        const extra = (extraTabs || []).find(t => t.id === activeTab);
        if (extra) return extra.render?.(extraTabData);
        return null;
      }
    }
  };

  return (
    <div className="reference-sidebar open" style={{ width: '340px', minWidth: '340px', borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="reference-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="reference-tabs" style={{ display: 'flex', gap: '2px', overflow: 'auto', flex: 1 }}>
          {tabKeys.map(key => {
            const tab = SIDEBAR_TABS[key];
            const extra = (extraTabs || []).find(t => t.id === key);
            if (!tab && !extra) return null;
            const Icon = tab?.icon || extra?.icon;
            const label = tab?.label || extra?.label;
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => onTabChange(key)} className={`reference-tab ${isActive ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap', padding: '4px 8px', fontSize: '11px', fontWeight: isActive ? 700 : 500, borderRadius: '4px', border: 'none', background: isActive ? 'rgba(204, 238, 0, 0.15)' : 'transparent', color: isActive ? '#ccee00' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Icon size={12} />
                  <span>{label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onToggle} className="reference-toggle-close" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }} title="Fechar painel">
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-black/40 border border-white/10 rounded text-xs text-white py-1.5 pl-7 pr-2 focus:outline-none focus:border-yellow-600" />
        </div>
      </div>

      <div className="reference-sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {listItems()}
      </div>

      {activeTab === 'characters' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => onEdit?.(null, 'character')} className="btn-primary w-full py-1.5 text-xs font-bold flex items-center justify-center gap-1">
            <Plus size={12} /> Novo Personagem
          </button>
        </div>
      )}
      {activeTab === 'locations' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => onEdit?.(null, 'location')} className="btn-primary w-full py-1.5 text-xs font-bold flex items-center justify-center gap-1">
            <Plus size={12} /> Nova Locação
          </button>
        </div>
      )}
      {activeTab === 'objects' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => onEdit?.(null, 'object')} className="btn-primary w-full py-1.5 text-xs font-bold flex items-center justify-center gap-1">
            <Plus size={12} /> Novo Objeto
          </button>
        </div>
      )}
    </div>
  );
}
