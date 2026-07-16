import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import FichaModal from './FichaModal';
import ConfirmModal from './ConfirmModal';
import CorkboardTab from './CorkboardTab';
import './EncyclopediaTab.css';
import { Plus, Edit3, Trash2, BookOpen, Compass, Paperclip, ArrowLeft, FileText, Target, Feather, Layers, Columns, MessageSquare, Globe } from 'lucide-react';

const ENTITY_TYPE_MAP = {
  characters: 'character',
  locations: 'location',
  objects: 'object',
  scenes: 'scene',
  plot_points: 'plot_point',
  dialogues: 'dialogue',
  world_elements: 'world_element',
  themes: 'theme',
  acts: 'act',
};

export default function EncyclopediaTab() {
  const {
    currentProject,
    saveCharacter,
    deleteCharacter,
    saveLocation,
    deleteLocation,
    saveObject,
    deleteObject,
    saveEntity,
    deleteEntityById,
    tabNavigation,
    navigateTo
  } = useProject();

  const [activeTab, setActiveTab] = useState('characters');
  const [fichaModal, setFichaModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showCorkboard, setShowCorkboard] = useState(false);

  useEffect(() => {
    if (!tabNavigation || tabNavigation.tab !== 'encyclopedia' || !tabNavigation.targetId) return;
    const target = tabNavigation.targetId;
    const entities = currentProject?.entities;
    const searchInEntities = (type, key) => (entities?.[type] || []).find(e => e[key] === target || e.id === target);
    const match = searchInEntities('characters', 'name') || (currentProject?.characters || []).find(c => c.name === target);
    if (match) { setActiveTab('characters'); setFichaModal({ item: match, type: 'character', mode: 'view' }); return; }
    const loc = searchInEntities('locations', 'name') || (currentProject?.locations || []).find(l => l.name === target);
    if (loc) { setActiveTab('locations'); setFichaModal({ item: loc, type: 'location', mode: 'view' }); return; }
    const obj = searchInEntities('objects', 'name') || (currentProject?.objects || []).find(o => o.name === target);
    if (obj) { setActiveTab('objects'); setFichaModal({ item: obj, type: 'object', mode: 'view' }); return; }
    const scene = searchInEntities('scenes', 'title');
    if (scene) { setActiveTab('scenes'); setFichaModal({ item: scene, type: 'scene', mode: 'view' }); return; }
    const pp = searchInEntities('plot_points', 'title');
    if (pp) { setActiveTab('plot_points'); setFichaModal({ item: pp, type: 'plot_point', mode: 'view' }); return; }
    const theme = searchInEntities('themes', 'statement');
    if (theme) { setActiveTab('themes'); setFichaModal({ item: theme, type: 'theme', mode: 'view' }); return; }
    const act = searchInEntities('acts', 'name');
    if (act) { setActiveTab('acts'); setFichaModal({ item: act, type: 'act', mode: 'view' }); return; }
    const dlg = searchInEntities('dialogues', 'speaker');
    if (dlg) { setActiveTab('dialogues'); setFichaModal({ item: dlg, type: 'dialogue', mode: 'view' }); return; }
    const world = searchInEntities('world_elements', 'name');
    if (world) { setActiveTab('world_elements'); setFichaModal({ item: world, type: 'world_element', mode: 'view' }); }
  }, [tabNavigation]);

  const handleFichaSave = (data) => {
    const t = fichaModal.type;
    if (t === 'character') saveCharacter(data);
    else if (t === 'location') saveLocation(data);
    else if (t === 'object') saveObject(data);
    else saveEntity(t + 's', data);
    setFichaModal(null);
  };

  const handleFichaDelete = (id) => {
    setConfirmModal({
      title: 'Excluir Ficha',
      message: 'Tem certeza que deseja excluir esta ficha?',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: () => { performDeleteFicha(id); setConfirmModal(null); },
      onCancel: () => setConfirmModal(null),
    });
  };
  const performDeleteFicha = (id) => {
    const t = fichaModal.type;
    if (t === 'character') deleteCharacter(id);
    else if (t === 'location') deleteLocation(id);
    else if (t === 'object') deleteObject(id);
    else deleteEntityById(t + 's', id);
    setFichaModal(null);
  };

  const openAddForm = () => {
    const t = ENTITY_TYPE_MAP[activeTab];
    const empty = {
      characters: { name: '', role: 'Coadjuvante', description: '', traits: [], backstory: '', notes: '' },
      locations: { name: '', type: 'INT.', description: '', timeOfDay: 'DIA', mood: '', group: '' },
      objects: { name: '', description: '', significance: '', group: '' },
      scenes: { title: '', synopsis: '', actId: '', order: 0, status: 'draft' },
      plot_points: { title: '', description: '', actId: '', tags: [] },
      dialogues: { speaker: '', line: '', context: '', tags: [] },
      world_elements: { name: '', type: 'setting', description: '', tags: [] },
      themes: { statement: '', evidence: '', relevance: 'Central' },
      acts: { name: '', order: 0, description: '', color: '#ccee00' },
    }[activeTab] || { name: '' };
    setFichaModal({ item: empty, type: t, mode: 'edit' });
  };

  const openEditForm = (item, tab) => {
    const targetTab = tab || activeTab;
    if (tab) setActiveTab(tab);
    const t = ENTITY_TYPE_MAP[targetTab];
    setFichaModal({ item, type: t, mode: 'view' });
  };

  const getList = () => {
    const e = currentProject?.entities || {};
    switch (activeTab) {
      case 'characters': return e.characters || [];
      case 'locations': return e.locations || [];
      case 'objects': return e.objects || [];
      case 'scenes': return e.scenes || [];
      case 'plot_points': return e.plot_points || [];
      case 'dialogues': return e.dialogues || [];
      case 'world_elements': return e.world_elements || [];
      case 'themes': return e.themes || [];
      case 'acts': return e.acts || [];
      default: return [];
    }
  };

  const getEntityCount = (type) => {
    const e = currentProject?.entities || {};
    return (e[type] || []).length;
  };

  const list = getList();

  if (!currentProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '14px' }}>Nenhum projeto selecionado</div>
        <div style={{ fontSize: '12px', color: '#555' }}>Crie ou selecione um projeto para usar a Enciclopédia</div>
      </div>
    );
  }

  const totalItems = getEntityCount('characters') + getEntityCount('locations') + getEntityCount('objects') + getEntityCount('scenes') + getEntityCount('plot_points') + getEntityCount('dialogues') + getEntityCount('world_elements') + getEntityCount('themes') + getEntityCount('acts');

  return (
    <div className="encyclopedia-container" data-onboarding="encyclopedia-tab">

      <div className="flex justify-between items-center px-2 mb-2">
        <span className="text-xs text-gray-500">{totalItems} itens no total</span>
      </div>

      <div className="encyclopedia-layout">
        <div className="flex justify-between items-center mb-2">
          <div className="tab-bar flex-1" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('characters')} className={`tab-btn text-sm ${activeTab === 'characters' ? 'active' : ''}`}>
              <BookOpen size={16} /> Personagens <span className="chip-count">{getEntityCount('characters')}</span>
            </button>
            <button onClick={() => setActiveTab('locations')} className={`tab-btn text-sm ${activeTab === 'locations' ? 'active' : ''}`}>
              <Compass size={16} /> Locações <span className="chip-count">{getEntityCount('locations')}</span>
            </button>
            <button onClick={() => setActiveTab('objects')} className={`tab-btn text-sm ${activeTab === 'objects' ? 'active' : ''}`}>
              <Paperclip size={16} /> Objetos <span className="chip-count">{getEntityCount('objects')}</span>
            </button>
            <button onClick={() => setActiveTab('scenes')} className={`tab-btn text-sm ${activeTab === 'scenes' ? 'active' : ''}`}>
              <FileText size={16} /> Cenas <span className="chip-count">{getEntityCount('scenes')}</span>
            </button>
            <button onClick={() => setActiveTab('plot_points')} className={`tab-btn text-sm ${activeTab === 'plot_points' ? 'active' : ''}`}>
              <Target size={16} /> Plot Points <span className="chip-count">{getEntityCount('plot_points')}</span>
            </button>
            <button onClick={() => setActiveTab('dialogues')} className={`tab-btn text-sm ${activeTab === 'dialogues' ? 'active' : ''}`}>
              <MessageSquare size={16} /> Diálogos <span className="chip-count">{getEntityCount('dialogues')}</span>
            </button>
            <button onClick={() => setActiveTab('world_elements')} className={`tab-btn text-sm ${activeTab === 'world_elements' ? 'active' : ''}`}>
              <Globe size={16} /> Mundo <span className="chip-count">{getEntityCount('world_elements')}</span>
            </button>
            <button onClick={() => setActiveTab('themes')} className={`tab-btn text-sm ${activeTab === 'themes' ? 'active' : ''}`}>
              <Feather size={16} /> Temas <span className="chip-count">{getEntityCount('themes')}</span>
            </button>
            <button onClick={() => setActiveTab('acts')} className={`tab-btn text-sm ${activeTab === 'acts' ? 'active' : ''}`}>
              <Layers size={16} /> Atos <span className="chip-count">{getEntityCount('acts')}</span>
            </button>
          </div>
          <button onClick={openAddForm} className="btn-primary py-2 px-3 text-xs flex items-center gap-1" data-onboarding="encyclopedia-create">
            <Plus size={14} /> Adicionar Ficha
          </button>
          <button onClick={() => setShowCorkboard(!showCorkboard)} className={`btn-secondary py-2 px-3 text-xs flex items-center gap-1 ml-2 ${showCorkboard ? 'active' : ''}`}>
            <Columns size={14} /> {showCorkboard ? 'Lista' : 'Mural'}
          </button>
        </div>

        {showCorkboard ? (
          <CorkboardTab />
        ) : (
        <div className="card-grid">
          {activeTab === 'characters' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum personagem cadastrado.</p>
          ) : (
            list.map(char => (
              <div key={char.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(char)} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`ficha-avatar-lg avatar-${char.avatar || 'amber'}`}>{char.name[0]}</div>
                      <div>
                        <h4 className="text-base font-bold text-white leading-tight">{char.name}</h4>
                        <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">{char.role}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-4 leading-relaxed">{char.description}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                  <span className="text-[10px] text-gray-500 italic truncate max-w-[150px]">
                    {char.traits && char.traits.length > 0 ? char.traits.join(', ') : 'Sem traços marcantes'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(char); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setFichaModal({ item: char, type: 'character', mode: 'view' }); handleFichaDelete(char.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'locations' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhuma locação cadastrada.</p>
          ) : (
            list.map(loc => (
              <div key={loc.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(loc)} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">{loc.name}</h4>
                      <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">{loc.type}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-4 leading-relaxed">{loc.description}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                  <span className="text-[10px] text-gray-500 font-mono">{loc.timeOfDay} • {loc.mood || 'Sem tom'}</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(loc); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setFichaModal({ item: loc, type: 'location', mode: 'view' }); handleFichaDelete(loc.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'objects' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum objeto cadastrado.</p>
          ) : (
            list.map(obj => (
              <div key={obj.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(obj)} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white">{obj.name}</h4>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-5 leading-relaxed">{obj.significance}</p>
                  {obj.description && <p className="text-[10px] text-gray-500 italic font-sans mt-2">Aparência: {obj.description}</p>}
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(obj); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setFichaModal({ item: obj, type: 'object', mode: 'view' }); handleFichaDelete(obj.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'scenes' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhuma cena cadastrada.</p>
          ) : (
            list.map(scene => (
              <div key={scene.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(scene, 'scenes')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{scene.title}</h4>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-3 leading-relaxed">{scene.synopsis}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <span className="text-[10px] bg-yellow-900/30 text-yellow-400 border border-yellow-800/30 px-1.5 py-0.5 rounded font-mono font-bold">
                      {scene.actId ? (currentProject?.entities?.acts || []).find(a => a.id === scene.actId)?.name || 'Sem ato' : 'Sem ato'}
                    </span>
                    <span className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800/30 px-1.5 py-0.5 rounded font-mono">
                      {scene.characterIds?.length || 0} personagens
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                  <span className="text-[10px] text-gray-500">{scene.status}</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(scene, 'scenes'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(scene.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'plot_points' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum plot point cadastrado.</p>
          ) : (
            list.map(pp => (
              <div key={pp.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(pp, 'plot_points')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{pp.title}</h4>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-3 leading-relaxed">{pp.description}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(pp.tags || []).map(t => (
                      <span key={t} className="text-[10px] bg-purple-900/30 text-purple-400 border border-purple-800/30 px-1.5 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(pp, 'plot_points'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(pp.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'themes' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum tema cadastrado.</p>
          ) : (
            list.map(theme => (
              <div key={theme.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(theme, 'themes')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 mb-1">TEMA</h4>
                  <p className="text-sm italic text-white leading-relaxed">"{theme.statement}"</p>
                  <p className="text-xs text-gray-400 mt-2 font-sans line-clamp-2">{theme.evidence}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                  <span className="text-[10px] text-gray-500 font-mono">{theme.relevance}</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(theme, 'themes'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(theme.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'dialogues' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum diálogo cadastrado.</p>
          ) : (
            list.map(dlg => (
              <div key={dlg.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(dlg, 'dialogues')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{dlg.speaker}</h4>
                  <p className="text-sm italic text-gray-300 mt-2 line-clamp-3 leading-relaxed">"{dlg.line}"</p>
                  {dlg.context && <p className="text-xs text-gray-500 mt-2 line-clamp-1">{dlg.context}</p>}
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(dlg, 'dialogues'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(dlg.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'world_elements' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum elemento de mundo cadastrado.</p>
          ) : (
            list.map(we => (
              <div key={we.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(we, 'world_elements')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{we.name}</h4>
                  <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">{we.type}</span>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-4 leading-relaxed">{we.description}</p>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(we, 'world_elements'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(we.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'themes' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum tema cadastrado.</p>
          ) : (
            list.map(theme => (
              <div key={theme.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(theme, 'themes')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 mb-1">TEMA</h4>
                  <p className="text-sm italic text-white leading-relaxed">"{theme.statement}"</p>
                  <p className="text-xs text-gray-400 mt-2 font-sans line-clamp-2">{theme.evidence}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                  <span className="text-[10px] text-gray-500 font-mono">{theme.relevance}</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(theme, 'themes'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(theme.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          ))}

          {activeTab === 'acts' && (list.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum ato cadastrado.</p>
          ) : (
            list.map(act => (
              <div key={act.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(act, 'acts')} style={{ cursor: 'pointer' }}>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">{act.name}</h4>
                  <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-3 leading-relaxed">{act.description}</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-[10px] text-gray-500">Ordem: {act.order + 1}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(act, 'acts'); }} className="text-gray-400 hover:text-white p-1" title="Editar"><Edit3 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleFichaDelete(act.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ))}
        </div>
      )}
      </div>

      {fichaModal && (
        <FichaModal
          item={fichaModal.item}
          type={fichaModal.type}
          mode={fichaModal.mode}
          acts={currentProject?.entities?.acts || []}
          onSave={handleFichaSave}
          onDelete={handleFichaDelete}
          onClose={() => setFichaModal(null)}
          onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
          onNavigateToMindMap={(id) => navigateTo('mindmap', id)}
        />
      )}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  );
}
