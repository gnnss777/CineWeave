import React, { useState, useEffect } from 'react';
import { parseFile } from '../lib/fileParser';
import { Search, FileText, ArrowLeft, Loader, Clapperboard } from 'lucide-react';

export default function ScriptBrowser() {
  const [scripts, setScripts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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
      const text = await parseFile(file);
      setContent(text);
    } catch (e) {
      setContent(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => { setSelected(null); setContent(''); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ccc', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={12} /> Voltar
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{selected}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', padding: 20, fontSize: 12 }}>
              <Loader size={14} className="animate-spin" /> Carregando...
            </div>
          )}
          {content && (
            <pre style={{ fontSize: 13, fontFamily: 'monospace', color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ padding: 4, borderRadius: 6, background: 'rgba(234,179,8,0.1)', color: '#eab308', display: 'flex' }}>
          <Clapperboard size={14} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Roteiros</span>
        <span style={{ fontSize: 12, color: '#555' }}>({scripts.length})</span>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 200 }}>
          <Search size={10} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '4px 4px 4px 22px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#fff', fontSize: 12, outline: 'none' }} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {filtered.map(s => (
          <div key={s.name} onClick={() => { setSelected(s.title); loadScript(s.name); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <FileText size={10} style={{ color: '#eab308', flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>{s.pages || '?'}p</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 20 }}>
            {search ? 'Nenhum roteiro encontrado.' : 'Nenhum roteiro disponível.'}
          </p>
        )}
      </div>
    </div>
  );
}
