import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { Plus, Edit3, Trash2, Shield, Eye, BookOpen, Compass, Paperclip, ArrowLeft } from 'lucide-react';

export default function EncyclopediaTab() {
  const { 
    currentProject, 
    saveCharacter, 
    deleteCharacter, 
    saveLocation, 
    deleteLocation, 
    saveObject, 
    deleteObject,
    tabNavigation,
    navigateTo
  } = useProject();

  const [activeTab, setActiveTab] = useState('characters');
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Field States
  // 1. Character fields
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Protagonista');
  const [charDescription, setCharDescription] = useState('');
  const [charTraits, setCharTraits] = useState('');
  const [charBackstory, setCharBackstory] = useState('');
  const [charNotes, setCharNotes] = useState('');
  const [charAvatar, setCharAvatar] = useState('amber');

  // 2. Location fields
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('INT.');
  const [locDescription, setLocDescription] = useState('');
  const [locTimeOfDay, setLocTimeOfDay] = useState('NOITE');
  const [locMood, setLocMood] = useState('');
  const [locGroup, setLocGroup] = useState('');

  // 3. Object fields
  const [objName, setObjName] = useState('');
  const [objSignificance, setObjSignificance] = useState('');
  const [objDescription, setObjDescription] = useState('');
  const [objGroup, setObjGroup] = useState('');

  // Cross-tab navigation: open ficha for target item
  useEffect(() => {
    if (!tabNavigation || tabNavigation.tab !== 'encyclopedia' || !tabNavigation.targetId) return;
    const target = tabNavigation.targetId;
    const openDirectly = (tab, fields) => {
      // Clear all fields first
      setCharName(''); setCharRole('Protagonista'); setCharDescription(''); setCharTraits(''); setCharBackstory(''); setCharNotes(''); setCharAvatar('amber');
      setLocName(''); setLocType('INT.'); setLocDescription(''); setLocTimeOfDay('NOITE'); setLocMood(''); setLocGroup('');
      setObjName(''); setObjSignificance(''); setObjDescription(''); setObjGroup('');
      // Set active tab and populate fields
      setActiveTab(tab);
      setEditingItem(fields);
      setIsFormOpen(true);
      if (tab === 'characters' && fields) {
        setCharName(fields.name || '');
        setCharRole(fields.role || 'Protagonista');
        setCharDescription(fields.description || '');
        setCharTraits(fields.traits ? fields.traits.join(', ') : '');
        setCharBackstory(fields.backstory || '');
        setCharNotes(fields.notes || '');
        setCharAvatar(fields.avatar || 'amber');
      } else if (tab === 'locations' && fields) {
        setLocName(fields.name || '');
        setLocType(fields.type || 'INT.');
        setLocDescription(fields.description || '');
        setLocTimeOfDay(fields.timeOfDay || 'NOITE');
        setLocMood(fields.mood || '');
        setLocGroup(fields.group || '');
        setTimeout(() => {}, 0);
      } else if (tab === 'objects' && fields) {
        setObjName(fields.name || '');
        setObjSignificance(fields.significance || '');
        setObjDescription(fields.description || '');
        setObjGroup(fields.group || '');
      }
    };
    const char = (currentProject?.characters || []).find(c => c.name === target);
    if (char) { openDirectly('characters', char); return; }
    const loc = (currentProject?.locations || []).find(l => l.name === target);
    if (loc) { openDirectly('locations', loc); return; }
    const obj = (currentProject?.objects || []).find(o => o.name === target);
    if (obj) { openDirectly('objects', obj); }
  }, [tabNavigation]);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
    
    // Clear forms
    setCharName('');
    setCharRole('Protagonista');
    setCharDescription('');
    setCharTraits('');
    setCharBackstory('');
    setCharNotes('');
    setCharAvatar('amber');

    setLocName('');
    setLocType('INT.');
    setLocDescription('');
    setLocTimeOfDay('NOITE');
    setLocMood('');
    setLocGroup('');

    setObjName('');
    setObjSignificance('');
    setObjDescription('');
    setObjGroup('');
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);

    if (activeTab === 'characters') {
      setCharName(item.name || '');
      setCharRole(item.role || 'Protagonista');
      setCharDescription(item.description || '');
      setCharTraits(item.traits ? item.traits.join(', ') : '');
      setCharBackstory(item.backstory || '');
      setCharNotes(item.notes || '');
      setCharAvatar(item.avatar || 'amber');
    } else if (activeTab === 'locations') {
      setLocName(item.name || '');
      setLocType(item.type || 'INT.');
      setLocDescription(item.description || '');
      setLocTimeOfDay(item.timeOfDay || 'NOITE');
      setLocMood(item.mood || '');
      setLocGroup(item.group || '');
    } else if (activeTab === 'objects') {
      setObjName(item.name || '');
      setObjSignificance(item.significance || '');
      setObjDescription(item.description || '');
      setObjGroup(item.group || '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === 'characters') {
      const traitsArray = charTraits.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const character = {
        id: editingItem?.id,
        name: charName,
        role: charRole,
        description: charDescription,
        traits: traitsArray,
        backstory: charBackstory,
        notes: charNotes,
        avatar: charAvatar
      };
      saveCharacter(character);
    } else if (activeTab === 'locations') {
      const location = {
        id: editingItem?.id,
        name: locName,
        type: locType,
        group: locGroup,
        description: locDescription,
        timeOfDay: locTimeOfDay,
        mood: locMood
      };
      saveLocation(location);
    } else if (activeTab === 'objects') {
      const object = {
        id: editingItem?.id,
        name: objName,
        group: objGroup,
        significance: objSignificance,
        description: objDescription
      };
      saveObject(object);
    }

    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ficha?')) return;
    
    if (activeTab === 'characters') {
      deleteCharacter(id);
    } else if (activeTab === 'locations') {
      deleteLocation(id);
    } else if (activeTab === 'objects') {
      deleteObject(id);
    }
  };

  return (
    <div className="encyclopedia-container">
      <style>{`
        .encyclopedia-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: var(--bg-darkest);
          padding: 1rem;
        }
        .encyclopedia-layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
          gap: 0.5rem;
        }
        .tab-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          padding: 0.75rem 1.2rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tab-btn.active {
          color: var(--primary-gold);
          border-bottom-color: var(--primary-gold);
          background: rgba(212, 163, 89, 0.03);
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.2rem;
          overflow-y: auto;
          padding-bottom: 2rem;
          flex-1;
        }
        .ficha-card {
          border-radius: 12px;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 240px;
        }
        .ficha-avatar-lg {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }
        .avatar-amber { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
        .avatar-purple { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; border: 1px solid #8b5cf6; }
        .avatar-red { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
        .avatar-green { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
        
      `}</style>

      <div className="encyclopedia-layout">
        <div className="flex justify-between items-center mb-2">
          <div className="tab-bar flex-1">
            <button onClick={() => setActiveTab('characters')} className={`tab-btn text-sm ${activeTab === 'characters' ? 'active' : ''}`}>
              <BookOpen size={16} /> Personagens
            </button>
            <button onClick={() => setActiveTab('locations')} className={`tab-btn text-sm ${activeTab === 'locations' ? 'active' : ''}`}>
              <Compass size={16} /> Locações
            </button>
            <button onClick={() => setActiveTab('objects')} className={`tab-btn text-sm ${activeTab === 'objects' ? 'active' : ''}`}>
              <Paperclip size={16} /> Objetos
            </button>
          </div>
          
          <button onClick={openAddForm} className="btn-primary py-2 px-3 text-xs flex items-center gap-1">
            <Plus size={14} /> Adicionar Ficha
          </button>
        </div>

        {/* Catalog Grid */}
        <div className="card-grid">
          {activeTab === 'characters' && (
            currentProject.characters.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum personagem cadastrado.</p>
            ) : (
              currentProject.characters.map(char => (
                <div key={char.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(char)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`ficha-avatar-lg avatar-${char.avatar || 'amber'}`}>
                          {char.name[0]}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white leading-tight">{char.name}</h4>
                          <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-semibold">{char.role}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-4 leading-relaxed">
                      {char.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                    <span className="text-[10px] text-gray-500 italic truncate max-w-[150px]">
                      {char.traits && char.traits.length > 0 ? char.traits.join(', ') : 'Sem traços marcantes'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEditForm(char); }} className="text-gray-400 hover:text-white p-1" title="Editar">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'locations' && (
            currentProject.locations.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhuma locação cadastrada.</p>
            ) : (
              currentProject.locations.map(loc => (
                <div key={loc.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(loc)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-white">{loc.name}</h4>
                        <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">
                          {loc.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-4 leading-relaxed">
                      {loc.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800/60">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {loc.timeOfDay} • {loc.mood || 'Sem tom'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEditForm(loc); }} className="text-gray-400 hover:text-white p-1" title="Editar">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'objects' && (
            currentProject.objects.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 col-span-full">Nenhum objeto cadastrado.</p>
            ) : (
              currentProject.objects.map(obj => (
                <div key={obj.id} className="ficha-card glass glass-interactive" onClick={() => openEditForm(obj)} style={{ cursor: 'pointer' }}>
                  <div>
                    <h4 className="text-base font-bold text-white">{obj.name}</h4>
                    <p className="text-xs text-gray-400 mt-3 font-sans line-clamp-5 leading-relaxed">
                      {obj.significance}
                    </p>
                    {obj.description && (
                      <p className="text-[10px] text-gray-500 italic font-sans mt-2">
                        Aparência: {obj.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800/60">
                    <button onClick={(e) => { e.stopPropagation(); openEditForm(obj); }} className="text-gray-400 hover:text-white p-1" title="Editar">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(obj.id); }} className="text-gray-400 hover:text-red-400 p-1" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Modal Add / Edit Form */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => { setIsFormOpen(false); setEditingItem(null); }}>
          <form onSubmit={handleSubmit} className="form-modal glass bg-black/95" onClick={(e) => e.stopPropagation()}>
            {/* Header bar (ir e voltar no mobile / titulo no desktop) */}
            <div className="form-modal-header">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="flex items-center gap-1 font-bold"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={20} />
                <span>Voltar</span>
              </button>
              <h3 className="text-lg font-bold text-white font-ui" style={{ margin: 0 }}>
                {editingItem ? 'Editar Ficha' : 'Adicionar Nova Ficha'}
              </h3>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '13px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="form-body-scroll">
              {activeTab === 'characters' && (
                <div className="form-grid-cols">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Nome do Personagem:</label>
                      <input 
                        type="text" 
                        value={charName} 
                        onChange={(e) => setCharName(e.target.value)}
                        required
                        placeholder="Ex: Detetive Max Santos"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <label>Papel:</label>
                        <select 
                          value={charRole} 
                          onChange={(e) => setCharRole(e.target.value)}
                        >
                          <option value="Protagonista">Protagonista</option>
                          <option value="Antagonista">Antagonista</option>
                          <option value="Coadjuvante">Coadjuvante</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Vítima">Vítima</option>
                        </select>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <label>Cor do Avatar:</label>
                        <select 
                          value={charAvatar} 
                          onChange={(e) => setCharAvatar(e.target.value)}
                        >
                          <option value="amber">Dourado (Max)</option>
                          <option value="purple">Roxo (Elisa)</option>
                          <option value="red">Vermelho (Kaelen)</option>
                          <option value="green">Verde (Shinoda)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Características / Traços (separados por vírgula):</label>
                      <input 
                        type="text" 
                        value={charTraits} 
                        onChange={(e) => setCharTraits(e.target.value)}
                        placeholder="Ex: Cínico, Rápido, Paranóico"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Descrição Física:</label>
                      <textarea 
                        value={charDescription} 
                        onChange={(e) => setCharDescription(e.target.value)}
                        style={{ minHeight: '110px' }}
                        placeholder="Escreva a descrição do visual do personagem..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Passado / Backstory:</label>
                      <textarea 
                        value={charBackstory} 
                        onChange={(e) => setCharBackstory(e.target.value)}
                        style={{ minHeight: '130px' }}
                        placeholder="Conte o passado relevante deste personagem..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Notas de Produção:</label>
                      <textarea 
                        value={charNotes} 
                        onChange={(e) => setCharNotes(e.target.value)}
                        style={{ minHeight: '110px' }}
                        placeholder="Hábitos, manias, ou observações..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'locations' && (
                <div className="form-grid-cols">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Nome da Locação:</label>
                      <input 
                        type="text" 
                        value={locName} 
                        onChange={(e) => setLocName(e.target.value)}
                        required
                        placeholder="Ex: Copan Noir Bar"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <label>Tipo:</label>
                        <select 
                          value={locType} 
                          onChange={(e) => setLocType(e.target.value)}
                        >
                          <option value="INT.">INT. (Interior)</option>
                          <option value="EXT.">EXT. (Exterior)</option>
                        </select>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <label>Horário:</label>
                        <select 
                          value={locTimeOfDay} 
                          onChange={(e) => setLocTimeOfDay(e.target.value)}
                        >
                          <option value="DIA">DIA</option>
                          <option value="NOITE">NOITE</option>
                          <option value="AMBOS">AMBOS</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Clima / Mood:</label>
                      <input 
                        type="text" 
                        value={locMood} 
                        onChange={(e) => setLocMood(e.target.value)}
                        placeholder="Ex: Escuro, chuvoso, neblina"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Grupo / Categoria:</label>
                      <input 
                        type="text" 
                        value={locGroup} 
                        onChange={(e) => setLocGroup(e.target.value)}
                        placeholder="Ex: Investigação, Zenith Corp, Zonas de Perigo..."
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Descrição Visual / Espacial:</label>
                      <textarea 
                        value={locDescription} 
                        onChange={(e) => setLocDescription(e.target.value)}
                        style={{ minHeight: '220px' }}
                        placeholder="Descreva o que vemos e ouvimos neste cenário..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'objects' && (
                <div className="form-grid-cols">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Nome do Objeto:</label>
                      <input 
                        type="text" 
                        value={objName} 
                        onChange={(e) => setObjName(e.target.value)}
                        required
                        placeholder="Ex: O Gravador de Almas"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Grupo / Categoria:</label>
                      <input 
                        type="text" 
                        value={objGroup} 
                        onChange={(e) => setObjGroup(e.target.value)}
                        placeholder="Ex: Pistas, Itens Pessoais, Armas..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Descrição Física:</label>
                      <textarea 
                        value={objDescription} 
                        onChange={(e) => setObjDescription(e.target.value)}
                        style={{ minHeight: '220px' }}
                        placeholder="Como ele se parece visualmente..."
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label>Significado na Trama:</label>
                      <textarea 
                        value={objSignificance} 
                        onChange={(e) => setObjSignificance(e.target.value)}
                        style={{ minHeight: '220px' }}
                        placeholder="Por que este objeto é importante? Quem o quer?"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop only bottom footer buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t border-gray-800/60" style={{ display: 'flex' }}>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="btn-secondary"
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer' }}
              >
                Salvar Ficha
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
