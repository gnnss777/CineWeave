import React, { useState } from 'react';
import { ArrowLeft, Edit3, Check, Trash2, MapPin, FileText } from 'lucide-react';

export default function FichaModal({ item, type, mode: initialMode, onSave, onDelete, onClose }) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');

  // Form state (always initialized from item)
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
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = buildData();
    onSave(data);
    onClose();
  };

  const buildData = () => {
    const base = { id: item?.id };
    if (type === 'character') {
      return {
        ...base,
        name: form.name,
        role: form.role,
        avatar: form.avatar,
        traits: form.traits.split(',').map(t => t.trim()).filter(Boolean),
        description: form.description,
        backstory: form.backstory,
        notes: form.notes,
      };
    }
    if (type === 'location') {
      return {
        ...base,
        name: form.name,
        type: form.locType,
        timeOfDay: form.timeOfDay,
        mood: form.mood,
        group: form.group,
        description: form.description,
      };
    }
    if (type === 'object') {
      return {
        ...base,
        name: form.name,
        group: form.group,
        description: form.description,
        significance: form.significance,
      };
    }
    return { ...base, name: form.name, description: form.description };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form onSubmit={handleSubmit} className="form-modal glass bg-black/95 max-w-[650px] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header flex items-center justify-between border-b border-white/5 pb-3">
          <button type="button" onClick={onClose} className="back-btn flex items-center gap-1.5">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <h3 className="modal-title font-bold text-base text-white">
            {item?.id ? (isEditing ? 'Editar Ficha' : 'Visualizar Ficha') : 'Nova Ficha'}
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
          {isEditing ? (
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
            </div>
          ) : (
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
            </div>
          )}
        </div>

        <div className="form-footer flex items-center justify-between border-t border-white/5 pt-3 mt-4">
          {item?.id ? (
            <button type="button" onClick={() => { onDelete(item.id); onClose(); }} className="btn-secondary py-1.5 px-3 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 rounded-lg">
              <Trash2 size={13} />
              <span>Excluir Ficha</span>
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-4 text-xs">
              {isEditing ? 'Cancelar' : 'Fechar'}
            </button>
            {isEditing && (
              <button type="submit" className="btn-primary py-1.5 px-5 text-xs font-bold rounded-lg">
                Salvar Ficha
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
