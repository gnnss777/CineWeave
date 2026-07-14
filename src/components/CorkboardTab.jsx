import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useEntities } from '../context/useEntities';
import FichaModal from './FichaModal';
import ConfirmModal from './ConfirmModal';
import './CorkboardTab.css';
import { ExternalLink, FileText, User, MapPin, Target, Heart, Plus } from 'lucide-react';

export default function CorkboardTab() {
  const { currentProject, updateProject, saveEntity, deleteEntityById, navigateTo } = useProject();
  const { scenes, acts, characters, locations, objects, plotPoints, themes } = useEntities();
  const [collapsedActs, setCollapsedActs] = useState({});
  const [showRibbon, setShowRibbon] = useState(true);
  const [fichaModal, setFichaModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const scenesByAct = acts.map(act => ({
    act,
    scenes: scenes.filter(s => s.actId === act.id).sort((a, b) => a.order - b.order),
  }));

  const unassignedScenes = scenes.filter(s => !s.actId);

  const handleDragStart = (e, sceneId) => {
    e.dataTransfer.setData('text/plain', sceneId);
  };

  const handleDrop = (e, targetActId) => {
    e.preventDefault();
    const sceneId = e.dataTransfer.getData('text/plain');
    if (!sceneId) return;
    const updatedScenes = scenes.map(s =>
      s.id === sceneId ? { ...s, actId: targetActId } : s
    );
    const proj = { ...currentProject };
    proj.entities = { ...proj.entities, scenes: updatedScenes };
    updateProject(proj);
  };

  const toggleCollapse = (actId) => {
    setCollapsedActs(prev => ({ ...prev, [actId]: !prev[actId] }));
  };

  const handleSaveFicha = (data) => {
    const t = fichaModal.type;
    if (t === 'character') saveEntity('characters', data);
    else if (t === 'location') saveEntity('locations', data);
    else if (t === 'object') saveEntity('objects', data);
    else if (t === 'scene') saveEntity('scenes', data);
    else if (t === 'plot_point') saveEntity('plot_points', data);
    else if (t === 'theme') saveEntity('themes', data);
    else if (t === 'act') saveEntity('acts', data);
    setFichaModal(null);
  };
  const handleDeleteFicha = (id) => {
    setConfirmModal({
      title: 'Excluir Ficha',
      message: 'Excluir esta ficha?',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: () => { performDeleteFicha(id); setConfirmModal(null); },
      onCancel: () => setConfirmModal(null),
    });
  };
  const performDeleteFicha = (id) => {
    if (!fichaModal?.type) return;
    const t = fichaModal.type;
    if (t === 'character') deleteEntityById('characters', id);
    else if (t === 'location') deleteEntityById('locations', id);
    else if (t === 'object') deleteEntityById('objects', id);
    else if (t === 'scene') deleteEntityById('scenes', id);
    else if (t === 'plot_point') deleteEntityById('plot_points', id);
    else if (t === 'theme') deleteEntityById('themes', id);
    else if (t === 'act') deleteEntityById('acts', id);
    setFichaModal(null);
  };

  const renderCard = (scene) => (
    <div
      key={scene.id}
      className="corkboard-card"
      draggable
      onDragStart={(e) => handleDragStart(e, scene.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="card-headline" style={{ flex: 1 }}>{scene.title}</div>
        <button
          onClick={(e) => { e.stopPropagation(); setFichaModal({ item: scene, type: 'scene', mode: 'view' }); }}
          style={{ background: 'none', border: 'none', color: '#ccee00', cursor: 'pointer', padding: '2px', marginLeft: '8px', flexShrink: 0 }}
          title="Ver Ficha"
        >
          <FileText size={12} />
        </button>
      </div>
      <div className="card-synopsis">{scene.synopsis}</div>
      <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span>{scene.characterIds?.length || 0} personagens</span>
          <span>{scene.status}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); navigateTo('screenplay', scene.id); }}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
          title="Ir para o Roteiro"
        >
          <ExternalLink size={10} /> Roteiro
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: '#030304' }}>


      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
          Corkboard — Mural de Cenas
        </h2>
        <p style={{ fontSize: '12px', color: '#7c7c82', marginTop: '4px' }}>
          Arraste cenas entre atos para reestruturar seu roteiro. Clique no ícone de ficha para ver detalhes.
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} /> Outras Fichas
          </h3>
          <button onClick={() => setShowRibbon(!showRibbon)} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '11px' }}>
            {showRibbon ? 'Recolher' : 'Expandir'}
          </button>
        </div>
        {showRibbon && (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {[
              { label: 'Personagens', items: characters, icon: User, type: 'character', emptyText: 'Nenhum personagem', color: 'var(--primary-gold)', newDefaults: { name: 'Novo Personagem', role: 'Coadjuvante', description: '', traits: [], backstory: '', notes: '', avatar: 'amber' } },
              { label: 'Locacoes', items: locations, icon: MapPin, type: 'location', emptyText: 'Nenhuma locacao', color: 'var(--color-location)', newDefaults: { name: 'Nova Locacao', type: 'EXT.', description: '', timeOfDay: 'DIA', mood: '' } },
              { label: 'Objetos', items: objects, icon: FileText, type: 'object', emptyText: 'Nenhum objeto', color: 'var(--color-object)', newDefaults: { name: 'Novo Objeto', description: '', significance: '' } },
              { label: 'Plot Points', items: plotPoints, icon: Target, type: 'plot_point', emptyText: 'Nenhum plot point', color: 'var(--primary-gold)', newDefaults: { name: 'Novo Plot Point', description: '', impact: '', storyArc: '' } },
              { label: 'Temas', items: themes, icon: Heart, type: 'theme', emptyText: 'Nenhum tema', color: '#ec4899', newDefaults: { name: 'Novo Tema', statement: '', description: '', tags: [] } },
            ].map(section => (
              <div key={section.type} style={{ minWidth: '180px', maxWidth: '220px', background: 'rgba(10,10,14,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: section.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <section.icon size={11} /> {section.label}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setFichaModal({ item: section.newDefaults, type: section.type, mode: 'edit' }); }} style={{ background: 'none', border: 'none', color: '#ccee00', cursor: 'pointer', padding: '2px' }} title={`Novo ${section.label}`}>
                    <Plus size={12} />
                  </button>
                </div>
                {section.items.length === 0 ? (
                  <p style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>{section.emptyText}</p>
                ) : (
                  section.items.slice(0, 5).map(item => (
                    <div key={item.id} onClick={() => setFichaModal({ item, type: section.type, mode: 'view' })} style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#d1d1d6', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <section.icon size={10} style={{ color: section.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.title || 'Sem nome'}</span>
                    </div>
                  ))
                )}
                {section.items.length > 5 && (
                  <p style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', marginTop: '4px' }}>+{section.items.length - 5} mais</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="corkboard-columns">
        {scenesByAct.map(({ act, scenes: actScenes }) => (
          <div
            key={act.id}
            className="corkboard-column"
            style={{ borderTop: `3px solid ${act.color || '#ccee00'}` }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-over');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('drag-over');
            }}
            onDrop={(e) => {
              e.currentTarget.classList.remove('drag-over');
              handleDrop(e, act.id);
            }}
          >
            <div className="act-header">
              <h3 className="act-title" style={{ color: act.color || '#ccee00', margin: 0 }}>
                {act.name}
              </h3>
              <button
                onClick={() => toggleCollapse(act.id)}
                style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}
              >
                {collapsedActs[act.id] ? 'Expandir' : 'Recolher'}
              </button>
            </div>

            {!collapsedActs[act.id] && (
              actScenes.length === 0 ? (
                <p style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  Arraste cenas para este ato
                </p>
              ) : (
                actScenes.map(scene => renderCard(scene))
              )
            )}
          </div>
        ))}

        {unassignedScenes.length > 0 && (
          <div
            className="corkboard-column"
            style={{ borderTop: '3px solid #6b7280', opacity: 0.7 }}
          >
            <h3 className="act-title" style={{ color: '#6b7280' }}>Não Atribuídas</h3>
            {unassignedScenes.map(scene => renderCard(scene))}
          </div>
        )}
      </div>

      {fichaModal && (
        <FichaModal
          item={fichaModal.item}
          type={fichaModal.type}
          mode={fichaModal.mode}
          acts={currentProject?.entities?.acts || []}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
          onClose={() => setFichaModal(null)}
          onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
        />
      )}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </div>
  );
}
