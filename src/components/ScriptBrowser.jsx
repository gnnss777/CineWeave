import React, { useState, useEffect, useMemo } from 'react';
import { parseFile } from '../lib/fileParser';
import { useProject } from '../context/ProjectContext';
import { parseFountain } from '../lib/fountainImport';
import { Search, FileText, ArrowLeft, Loader, Clapperboard, Download, Sparkles, BookOpen } from 'lucide-react';

export default function ScriptBrowser() {
  const { currentProject, updateScreenplay, navigateTo } = useProject();
  const [scripts, setScripts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'

  useEffect(() => {
    fetch('/roteiros/index.json')
      .then(r => r.json())
      .then(setScripts)
      .catch(() => setScripts([]));
  }, []);

  const loadScript = async (name) => {
    setLoading(true);
    setContent('');
    try {
      const resp = await fetch(`/roteiros/${name}`);
      const blob = await resp.blob();
      const file = new File([blob], name, { type: 'application/pdf' });
      const parsed = await parseFile(file);
      setContent(parsed.text || '');
    } catch (e) {
      setContent(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const handleImport = () => {
    if (!content || !currentProject) return;
    setImporting(true);
    try {
      const elements = parseFountain(content);
      if (elements.length > 0) {
        updateScreenplay(elements);
        navigateTo('screenplay');
      }
    } catch (e) {
      console.error('Erro ao importar roteiro:', e);
    }
    setImporting(false);
  };

  const elements = useMemo(() => {
    return content ? parseFountain(content) : [];
  }, [content]);

  const getStyleForType = (type) => {
    switch (type) {
      case 'scene-heading': return 'script-scene-heading';
      case 'action': return 'script-action';
      case 'character': return 'script-character';
      case 'parenthetical': return 'script-parenthetical';
      case 'dialogue': return 'script-dialogue';
      case 'transition': return 'script-transition';
      case 'section': return 'script-section';
      case 'synopsis': return 'script-synopsis';
      default: return 'script-action';
    }
  };

  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setSelected(null); setContent(''); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ccc', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <ArrowLeft size={14} /> Voltar
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selected}</span>
          </div>
          
          <div style={{ flex: 1 }} />
          
          {content && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* View Mode Toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setViewMode('formatted')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: viewMode === 'formatted' ? '#ccee00' : 'transparent', color: viewMode === 'formatted' ? '#000' : '#888', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Sparkles size={12} /> Formatado CineWeave
                </button>
                <button onClick={() => setViewMode('raw')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: viewMode === 'raw' ? '#ccee00' : 'transparent', color: viewMode === 'raw' ? '#000' : '#888', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <BookOpen size={12} /> Código Fountain (.fountain)
                </button>
              </div>

              {/* Import Button */}
              <button onClick={handleImport} disabled={importing}
                style={{ background: '#ccee00', border: 'none', color: '#000', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(204,238,0,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Download size={14} /> {importing ? 'Importando...' : 'Editar no CineWeave'}
              </button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: '#080808' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#888', padding: '60px 20px', fontSize: 14 }}>
              <Loader size={24} className="animate-spin" style={{ color: '#ccee00' }} />
              <span>Processando e formatando roteiro PDF...</span>
            </div>
          )}
          {content && !loading && viewMode === 'formatted' && (
            <div className="screenplay-container dark-paper" style={{ margin: '0 auto 40px auto', maxWidth: '816px', padding: '4rem 5rem', border: '1px solid rgba(204, 238, 0, 0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
              {elements.map((el, idx) => (
                <div key={el.id || idx} className={`script-element ${getStyleForType(el.type)}`}>
                  {el.text}
                </div>
              ))}
            </div>
          )}
          {content && !loading && viewMode === 'raw' && (
            <pre style={{ fontSize: 14, fontFamily: '"Courier Prime", Courier, monospace', color: '#eaeaea', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: '0 auto', maxWidth: '800px', background: '#0a0a0a', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ padding: 6, borderRadius: 8, background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex' }}>
          <Clapperboard size={18} />
        </div>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'block' }}>Banco de Roteiros PDF</span>
          <span style={{ fontSize: 11, color: '#888' }}>Visualize clássicos e converta-os para o formato editável do CineWeave</span>
        </div>
        <span style={{ fontSize: 12, color: '#555', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 20 }}>{scripts.length}</span>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input type="text" placeholder="Buscar roteiro clássico..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = '#ccee00'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(s => (
            <div key={s.name} onClick={() => { setSelected(s.title); loadScript(s.name); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '#ccee00'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} style={{ color: '#ccee00', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{s.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#666', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                <span>Formato PDF</span>
                <span style={{ background: 'rgba(204,238,0,0.1)', color: '#ccee00', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Visualizar</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 40 }}>
            {search ? 'Nenhum roteiro encontrado.' : 'Nenhum roteiro disponível.'}
          </p>
        )}
      </div>
    </div>
  );
}
