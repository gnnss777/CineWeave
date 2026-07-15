import React, { useState } from 'react';
import { ArrowLeft, Edit3, Check, Trash2, MapPin, FileText, Target, Feather, Layers } from 'lucide-react';

const TYPE_LABELS = {
  character: 'Personagem',
  location: 'Locação',
  object: 'Objeto',
  scene: 'Cena',
  plot_point: 'Plot Point',
  theme: 'Tema',
  act: 'Ato',
};

export default function FichaModal({ item, type, mode: initialMode, onSave, onDelete, onClose, acts = [], onNavigateToEncyclopedia, onNavigateToScreenplay }) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');

  const [form, setForm] = useState({
    name: item?.name || '',
    role: item?.role || 'Protagonista',
    avatar: item?.avatar || 'amber',
    traits: (item?.traits || []).join(', '),
    description: item?.description || '',
    backstory: item?.backstory || '',
    notes: item?.notes || '',
    locType: item?.type || 'INT.',
    timeOfDay: item?.timeOfDay || 'DIA',
    mood: item?.mood || '',
    group: item?.group || '',
    significance: item?.significance || '',

    sceneTitle: item?.title || '',
    sceneSynopsis: item?.synopsis || '',
    sceneActId: item?.actId || '',
    sceneOrder: item?.order ?? 0,
    sceneStatus: item?.status || 'draft',
    sceneCharacterIds: (item?.characterIds || []).join(', '),

    plotTitle: item?.title || '',
    plotDescription: item?.description || '',
    plotActId: item?.actId || '',
    plotTags: (item?.tags || []).join(', '),

    themeStatement: item?.statement || '',
    themeEvidence: item?.evidence || '',
    themeRelevance: item?.relevance || 'Central',

    actName: item?.name || '',
    actOrder: item?.order ?? 0,
    actDescription: item?.description || '',
    actColor: item?.color || '#ccee00',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(buildData());
    onClose();
  };

  const buildData = () => {
    const base = { id: item?.id };
    switch (type) {
      case 'character':
        return {
          ...base, name: form.name, role: form.role, avatar: form.avatar,
          traits: form.traits.split(',').map(t => t.trim()).filter(Boolean),
          description: form.description, backstory: form.backstory, notes: form.notes,
        };
      case 'location':
        return {
          ...base, name: form.name, type: form.locType, timeOfDay: form.timeOfDay,
          mood: form.mood, group: form.group, description: form.description,
        };
      case 'object':
        return {
          ...base, name: form.name, group: form.group,
          description: form.description, significance: form.significance,
        };
      case 'scene':
        return {
          ...base, title: form.sceneTitle, synopsis: form.sceneSynopsis,
          actId: form.sceneActId || null, order: Number(form.sceneOrder),
          status: form.sceneStatus,
          characterIds: form.sceneCharacterIds.split(',').map(s => s.trim()).filter(Boolean),
        };
      case 'plot_point':
        return {
          ...base, title: form.plotTitle, description: form.plotDescription,
          actId: form.plotActId || null,
          tags: form.plotTags.split(',').map(t => t.trim()).filter(Boolean),
        };
      case 'theme':
        return {
          ...base, statement: form.themeStatement, evidence: form.themeEvidence,
          relevance: form.themeRelevance,
        };
      case 'act':
        return {
          ...base, name: form.actName, order: Number(form.actOrder),
          description: form.actDescription, color: form.actColor,
        };
      default:
        return { ...base, name: form.name, description: form.description };
    }
  };

  const getActName = (actId) => (acts.find(a => a.id === actId) || {}).name || 'Sem ato';

  const footerRight = (
    <div className="flex items-center gap-2">
      {onNavigateToEncyclopedia && item?.id && (
        <button type="button" onClick={() => { onNavigateToEncyclopedia(item.id); onClose(); }}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 rounded-lg">
          <Layers size={12} />
          <span>Enciclopédia</span>
        </button>
      )}
      <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-4 text-xs">
        {isEditing ? 'Cancelar' : 'Fechar'}
      </button>
      {isEditing && (
        <button type="submit" className="btn-primary py-1.5 px-5 text-xs font-bold rounded-lg">
          Salvar Ficha
        </button>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form onSubmit={handleSubmit} className="form-modal glass bg-black/95 max-w-[650px] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header flex items-center justify-between border-b border-white/5 pb-3">
          <button type="button" onClick={onClose} className="back-btn flex items-center gap-1.5">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <h3 className="modal-title font-bold text-base text-white">
            {item?.id ? (isEditing ? 'Editar Ficha' : `Ficha — ${TYPE_LABELS[type] || type}`) : `Nova ${TYPE_LABELS[type] || type}`}
          </h3>
          <div className="flex items-center gap-2">
            {item?.id && !isEditing && (
              <button type="button" onClick={() => setIsEditing(true)} className="btn-secondary py-1 px-3 text-xs font-bold rounded-lg flex items-center gap-1">
                <Edit3 size={12} />
                <span>Editar</span>
              </button>
            )}
            {isEditing && (
              <button type="submit" className="btn-primary py-1 px-4 text-xs font-bold rounded-lg flex items-center gap-1">
                <Check size={12} />
                <span>Salvar</span>
              </button>
            )}
          </div>
        </div>

        <div className="form-body-scroll py-4 max-h-[70vh] overflow-y-auto">
          {isEditing ? renderEditForm(type, form, set, acts) : renderViewCard(type, item, acts, getActName)}
        </div>

        <div className="form-footer flex items-center justify-between border-t border-white/5 pt-3 mt-4">
          {item?.id ? (
            <button type="button" onClick={() => { onDelete(item.id); onClose(); }} className="btn-secondary py-1.5 px-3 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 rounded-lg">
              <Trash2 size={13} />
              <span>Excluir Ficha</span>
            </button>
          ) : <div />}
          {footerRight}
        </div>
        
        {/* Botão "Ver no Roteiro" */}
        {item?.id && onNavigateToScreenplay && (
          <div className="ficha-actions mt-4">
            <button className="btn btn-primary" onClick={() => onNavigateToScreenplay(item.id)}>
              Ver no Roteiro
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function renderEditForm(type, form, set, acts) {
  return (
    <div className="flex flex-col gap-4 text-left">
      {type === 'character' && (
        <>
          <div className="field-row gap-4">
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Nome</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Ex: Fumaça" />
            </div>
            <div className="field-group w-1/3">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Avatar</label>
              <select value={form.avatar} onChange={set('avatar')}>
                <option value="amber">Dourado</option>
                <option value="purple">Roxo</option>
                <option value="red">Vermelho</option>
                <option value="green">Verde</option>
                <option value="blue">Azul</option>
                <option value="pink">Rosa</option>
              </select>
            </div>
          </div>
          <div className="field-row gap-4">
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Papel</label>
              <select value={form.role} onChange={set('role')}>
                <option value="Protagonista">Protagonista</option>
                <option value="Antagonista">Antagonista</option>
                <option value="Coadjuvante">Coadjuvante</option>
                <option value="Mentor">Mentor</option>
                <option value="Aliado Secreto">Aliado Secreto</option>
                <option value="Vítima">Vítima</option>
              </select>
            </div>
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Tags / Traços</label>
              <input type="text" value={form.traits} onChange={set('traits')} placeholder="Ex: Cínico, Rápido, Melancólico" />
            </div>
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Descrição física e psicológica..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Backstory</label>
            <textarea value={form.backstory} onChange={set('backstory')} rows={4} placeholder="História pregressa do personagem..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Notas</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Observações para o roteirista..." />
          </div>
        </>
      )}
      {type === 'location' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Nome</label>
            <input type="text" value={form.name} onChange={set('name')} required placeholder="Ex: O Quintal" />
          </div>
          <div className="field-row gap-4">
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Tipo</label>
              <select value={form.locType} onChange={set('locType')}>
                <option value="INT.">INT. (Interior)</option>
                <option value="EXT.">EXT. (Exterior)</option>
                <option value="INT./EXT.">INT./EXT. (Ambos)</option>
              </select>
            </div>
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Período</label>
              <select value={form.timeOfDay} onChange={set('timeOfDay')}>
                <option value="DIA">DIA</option>
                <option value="NOITE">NOITE</option>
                <option value="TARDE">TARDE</option>
                <option value="AMANHECER">AMANHECER</option>
                <option value="ENTARDECER">ENTARDECER</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Mood / Atmosfera</label>
            <input type="text" value={form.mood} onChange={set('mood')} placeholder="Ex: Chuvoso, sombrio, místico..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Grupo / Categoria</label>
            <input type="text" value={form.group} onChange={set('group')} placeholder="Ex: Territórios, Zonas de Perigo..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição</label>
            <textarea value={form.description} onChange={set('description')} rows={5} placeholder="Descreva o ambiente..." />
          </div>
        </>
      )}
      {type === 'object' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Nome</label>
            <input type="text" value={form.name} onChange={set('name')} required placeholder="Ex: Bomba de Fumaça" />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Grupo / Categoria</label>
            <input type="text" value={form.group} onChange={set('group')} placeholder="Ex: Itens, Armas, Pistas..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição Física</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Aparência, textura, peso..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Significado na Trama</label>
            <textarea value={form.significance} onChange={set('significance')} rows={5} placeholder="Qual a relevância deste item para a história?" />
          </div>
        </>
      )}
      {type === 'scene' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Título / Cabeçalho</label>
            <input type="text" value={form.sceneTitle} onChange={set('sceneTitle')} required placeholder="Ex: INT. LABIRINTO DE CRISTAL - NOITE" />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Sinopse</label>
            <textarea value={form.sceneSynopsis} onChange={set('sceneSynopsis')} rows={3} placeholder="Resumo da cena..." />
          </div>
          <div className="field-row gap-4">
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Ato</label>
              <select value={form.sceneActId} onChange={set('sceneActId')}>
                <option value="">Sem ato</option>
                {acts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field-group w-20">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Ordem</label>
              <input type="number" value={form.sceneOrder} onChange={set('sceneOrder')} min="0" />
            </div>
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Status</label>
              <select value={form.sceneStatus} onChange={set('sceneStatus')}>
                <option value="draft">Rascunho</option>
                <option value="revised">Revisado</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">IDs de Personagens (separados por vírgula)</label>
            <input type="text" value={form.sceneCharacterIds} onChange={set('sceneCharacterIds')} placeholder="Ex: char-xxx, char-yyy" />
          </div>
        </>
      )}
      {type === 'plot_point' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Título</label>
            <input type="text" value={form.plotTitle} onChange={set('plotTitle')} required placeholder="Ex: O Encontro" />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição</label>
            <textarea value={form.plotDescription} onChange={set('plotDescription')} rows={4} placeholder="Descreva o plot point..." />
          </div>
          <div className="field-row gap-4">
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Ato</label>
              <select value={form.plotActId} onChange={set('plotActId')}>
                <option value="">Sem ato</option>
                {acts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Tags (separadas por vírgula)</label>
              <input type="text" value={form.plotTags} onChange={set('plotTags')} placeholder="Ex: clímax, reviravolta" />
            </div>
          </div>
        </>
      )}
      {type === 'theme' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Frase Tema / Statement</label>
            <input type="text" value={form.themeStatement} onChange={set('themeStatement')} required placeholder="Ex: O passado nunca enterra seus mortos" />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Evidências no Roteiro</label>
            <textarea value={form.themeEvidence} onChange={set('themeEvidence')} rows={4} placeholder="Como este tema aparece na história..." />
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Relevância</label>
            <select value={form.themeRelevance} onChange={set('themeRelevance')}>
              <option value="Central">Central</option>
              <option value="Secondary">Secundário</option>
              <option value="Implied">Implícito</option>
            </select>
          </div>
        </>
      )}
      {type === 'act' && (
        <>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Nome do Ato</label>
            <input type="text" value={form.actName} onChange={set('actName')} required placeholder="Ex: ATO I — O Chamado" />
          </div>
          <div className="field-row gap-4">
            <div className="field-group w-20">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Ordem</label>
              <input type="number" value={form.actOrder} onChange={set('actOrder')} min="0" />
            </div>
            <div className="field-group flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase mb-1">Cor</label>
              <input type="color" value={form.actColor} onChange={set('actColor')} style={{ width: '100%', height: '32px', background: 'transparent', border: '1px solid #1d1d24', borderRadius: '6px', cursor: 'pointer' }} />
            </div>
          </div>
          <div className="field-group">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição</label>
            <textarea value={form.actDescription} onChange={set('actDescription')} rows={4} placeholder="O que acontece neste ato..." />
          </div>
        </>
      )}
    </div>
  );
}

function renderViewCard(type, item, acts, getActName) {
  return (
    <div className="readonly-card flex flex-col gap-4 text-left">
      {type === 'character' && (
        <>
          <div className="readonly-avatar-row flex items-center gap-3">
            <div className={`sidebar-avatar large avatar-${item?.avatar || 'amber'}`}>
              {item?.name ? item.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.name}</h4>
              <span className="readonly-role text-sm text-gray-400">{item?.role}</span>
            </div>
          </div>
          {(item?.traits || []).length > 0 && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Tags / Traços</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {item.traits.map((t, i) => <span key={i} className="trait-tag text-xs">{t}</span>)}
              </div>
            </div>
          )}
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Descrição</label>
            <p className="text-sm text-gray-300 mt-1">{item?.description || 'Nenhuma descrição.'}</p>
          </div>
          {item?.backstory && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Backstory</label>
              <p className="text-sm text-gray-300 mt-1">{item.backstory}</p>
            </div>
          )}
          {item?.notes && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Notas</label>
              <p className="text-sm text-gray-300 mt-1">{item.notes}</p>
            </div>
          )}
        </>
      )}
      {type === 'location' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large avatar-location">
              <MapPin size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.name}</h4>
              <span className="readonly-role text-sm text-gray-400">{item?.type} &bull; {item?.timeOfDay}</span>
            </div>
          </div>
          {item?.group && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Grupo</label>
              <p className="text-sm text-gray-300 mt-1">{item.group}</p>
            </div>
          )}
          {item?.mood && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Mood / Atmosfera</label>
              <p className="text-sm text-gray-300 mt-1">{item.mood}</p>
            </div>
          )}
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Descrição</label>
            <p className="text-sm text-gray-300 mt-1">{item?.description || 'Nenhuma descrição.'}</p>
          </div>
        </>
      )}
      {type === 'object' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large avatar-object">
              <FileText size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.name}</h4>
              <span className="readonly-role text-sm text-gray-400">Objeto de Cena</span>
            </div>
          </div>
          {item?.group && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Grupo</label>
              <p className="text-sm text-gray-300 mt-1">{item.group}</p>
            </div>
          )}
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Descrição</label>
            <p className="text-sm text-gray-300 mt-1">{item?.description || 'Nenhuma descrição.'}</p>
          </div>
          {item?.significance && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Importância na Trama</label>
              <p className="text-sm text-gray-300 mt-1">{item.significance}</p>
            </div>
          )}
        </>
      )}
      {type === 'scene' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
              <FileText size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.title}</h4>
              <span className="readonly-role text-sm text-gray-400">Cena {item?.order !== undefined ? `#${item.order + 1}` : ''}</span>
            </div>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Ato</label>
            <p className="text-sm text-gray-300 mt-1">{item?.actId ? getActName(item.actId) : 'Sem ato'}</p>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Sinopse</label>
            <p className="text-sm text-gray-300 mt-1">{item?.synopsis || 'Nenhuma sinopse.'}</p>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Status</label>
            <p className="text-sm text-gray-300 mt-1">{item?.status || 'draft'}</p>
          </div>
        </>
      )}
      {type === 'plot_point' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid #a855f7' }}>
              <Target size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.title}</h4>
            </div>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Descrição</label>
            <p className="text-sm text-gray-300 mt-1">{item?.description || 'Nenhuma descrição.'}</p>
          </div>
          {item?.actId && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Ato</label>
              <p className="text-sm text-gray-300 mt-1">{getActName(item.actId)}</p>
            </div>
          )}
          {(item?.tags || []).length > 0 && (
            <div className="readonly-section">
              <label className="text-xs text-gray-500 uppercase font-bold">Tags</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {item.tags.map((t, i) => <span key={i} className="trait-tag text-xs">{t}</span>)}
              </div>
            </div>
          )}
        </>
      )}
      {type === 'theme' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
              <Feather size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">Tema</h4>
              <span className="readonly-role text-sm text-gray-400">{item?.relevance}</span>
            </div>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Frase Tema</label>
            <p className="text-sm italic text-white mt-1">"{item?.statement}"</p>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Evidências</label>
            <p className="text-sm text-gray-300 mt-1">{item?.evidence || 'Nenhuma evidência.'}</p>
          </div>
        </>
      )}
      {type === 'act' && (
        <>
          <div className="flex items-center gap-3">
            <div className="sidebar-avatar large" style={{ background: `${item?.color || '#ccee00'}22`, color: item?.color || '#ccee00', border: `1px solid ${item?.color || '#ccee00'}` }}>
              <Layers size={22} />
            </div>
            <div>
              <h4 className="readonly-name text-lg font-bold text-white">{item?.name}</h4>
              <span className="readonly-role text-sm text-gray-400">Ordem {item?.order !== undefined ? item.order + 1 : ''}</span>
            </div>
          </div>
          <div className="readonly-section">
            <label className="text-xs text-gray-500 uppercase font-bold">Descrição</label>
            <p className="text-sm text-gray-300 mt-1">{item?.description || 'Nenhuma descrição.'}</p>
          </div>
        </>
      )}
    </div>
  );
}
