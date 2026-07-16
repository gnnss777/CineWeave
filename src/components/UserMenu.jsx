import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar } from '../lib/supabase';
import Avatar, { getAvatarColor } from './Avatar';
import { LogOut, Settings, Loader2, Camera } from 'lucide-react';

const COLOR_OPTIONS = [
  '#ccee00', '#f59e0b', '#4ade80', '#818cf8', '#f87171',
  '#2dd4bf', '#fb923c', '#a78bfa', '#34d399', '#f472b6',
  '#38bdf8', '#e879f9', '#fbbf24', '#86efac', '#c4b5fd',
];

export default function UserMenu() {
  const { user, profile, logout, saveProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [selectedColor, setSelectedColor] = useState(profile?.avatar_color || 'ccee00');
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    try {
      await saveProfile({
        display_name: displayName.trim() || null,
        avatar_color: selectedColor || 'ccee00',
      });
      setEditing(false);
    } catch {}
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await saveProfile({ avatar_url: url });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    await saveProfile({ avatar_url: null });
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const displayNameStr = profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs"
        style={{
          color: '#4ade80',
          background: 'rgba(74,222,128,0.1)',
          border: '1px solid rgba(74,222,128,0.3)',
          cursor: 'pointer',
        }}
        title={displayNameStr}
      >
        <Avatar profile={profile} user={user} size={20} />
        <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayNameStr}
        </span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '6px',
            width: '320px', background: '#111', border: '1px solid #222',
            borderRadius: '12px', padding: '24px', zIndex: 99999,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                <Avatar profile={profile} user={user} size={72} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: uploading ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = uploading ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)'}
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" style={{ color: '#fff' }} /> : <Camera size={20} style={{ color: '#fff', opacity: 0.8 }} />}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              </div>
              {profile?.avatar_url && (
                <button onClick={handleRemovePhoto} style={{ fontSize: '10px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Remover foto
                </button>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                  {profile?.display_name || user?.email?.split('@')[0]}
                </div>
                {profile?.username && profile?.username !== profile?.display_name && (
                  <div style={{ fontSize: '11px', color: '#888' }}>@{profile.username}</div>
                )}
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{user?.email}</div>
              </div>
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>
                    Nome de exibição
                  </label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Seu nome" className="dark-input w-full text-xs" />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                    Cor do avatar
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c.replace('#', ''))}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: c, border: selectedColor === c.replace('#', '') ? '2px solid #fff' : '2px solid transparent',
                          cursor: 'pointer', padding: 0, outline: 'none',
                          boxShadow: selectedColor === c.replace('#', '') ? `0 0 0 2px ${c}` : 'none',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleSave} className="btn-primary py-1.5 text-xs flex-1 justify-center">
                    Salvar
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 text-xs">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button onClick={() => { setEditing(true); setDisplayName(profile?.display_name || ''); setSelectedColor(profile?.avatar_color || 'ccee00'); }}
                  className="btn-secondary py-1.5 text-xs justify-center">
                  <Settings size={12} /> Editar Perfil
                </button>
                <button onClick={handleLogout}
                  style={{ padding: '6px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <LogOut size={12} /> Sair
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
