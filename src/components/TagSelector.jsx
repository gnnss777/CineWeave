import React, { useState } from 'react';
import { X, Plus, Hash } from 'lucide-react';

const PRESET_COLORS = [
  { bg: 'rgba(204,238,0,0.15)', text: '#ccee00', border: 'rgba(204,238,0,0.3)' },
  { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
  { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: 'rgba(168,85,247,0.3)' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
];

export default function TagSelector({ tags = [], onChange, suggestions = [], placeholder = 'Adicionar tag...' }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {tags.map((tag, i) => {
          const color = PRESET_COLORS[i % PRESET_COLORS.length];
          return (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '12px',
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.border}`,
              }}
            >
              <Hash size={10} />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: color.text,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  opacity: 0.7,
                }}
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
              if (e.key === ',' || e.key === ';') { e.preventDefault(); addTag(input.replace(/[,;]$/, '')); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '6px 10px',
              background: '#151515',
              border: '1px solid #1d1d24',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
            }}
            onFocusCapture={e => e.target.style.borderColor = '#ccee00'}
            onBlurCapture={e => e.target.style.borderColor = '#1d1d24'}
          />
          <button
            onClick={() => addTag(input)}
            disabled={!input.trim()}
            style={{
              padding: '6px 10px',
              background: 'rgba(204,238,0,0.1)',
              border: '1px solid rgba(204,238,0,0.2)',
              borderRadius: '8px',
              color: '#ccee00',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: input.trim() ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Plus size={14} />
          </button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            zIndex: 100,
            marginTop: '4px',
            maxHeight: '150px',
            overflow: 'auto',
          }}>
            {filteredSuggestions.map(s => (
              <div
                key={s}
                onMouseDown={() => addTag(s)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: '#ccc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(204,238,0,0.08)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <Hash size={10} style={{ color: '#737373' }} />
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
