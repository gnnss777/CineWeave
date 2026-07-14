import React, { useState, useEffect } from 'react';
import { parseFile } from '../lib/fileParser';
import { Search, FileText, BookOpen, ArrowLeft, Loader, Clapperboard } from 'lucide-react';

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
      setContent(`Erro ao carregar roteiro: ${e.message}`);
    }
    setLoading(false);
  };

  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { setSelected(null); setContent(''); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ccc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{selected}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#888', padding: 40 }}>
              <Loader size={16} className="animate-spin" />
              <span style={{ fontSize: 13 }}>Carregando...</span>
            </div>
          )}
          {content && (
            <pre style={{ fontSize: 12, fontFamily: 'monospace', color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Clapperboard size={18} style={{ color: '#eab308' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Roteiros de Referência</h2>
          <span style={{ fontSize: 11, color: '#555' }}>({scripts.length})</span>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            type="text"
            placeholder="Buscar roteiro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 8px 8px 30px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {filtered.map(s => (
            <div
              key={s.name}
              onClick={() => { setSelected(s.title); loadScript(s.name); }}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 6, borderRadius: 8, background: 'rgba(234,179,8,0.1)', color: '#eab308', display: 'flex' }}>
                  <FileText size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{s.pages || '?'}p</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 40 }}>
            {search ? 'Nenhum roteiro encontrado.' : 'Nenhum roteiro disponível.'}
          </p>
        )}
      </div>
    </div>
  );
}
