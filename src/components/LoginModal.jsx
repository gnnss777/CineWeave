import React, { useState, useEffect } from 'react';
import { signIn, signUp, signOut, getSession } from '../lib/supabase';
import { isConfigured } from '../lib/sync';
import { User, LogOut, Loader2, X, Film, Cloud } from 'lucide-react';

export default function LoginModal() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConfigured()) { setChecking(false); return; }
    getSession().then(s => {
      if (s?.user) {
        setUser(s.user);
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const data = await signIn(email, password);
        setUser(data.user);
        setShowModal(false);
      } else {
        const data = await signUp(email, password);
        if (data.user || data.session) {
          setUser(data.user);
          setShowModal(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setEmail('');
    setPassword('');
    setShowModal(true);
  };

  if (!isConfigured()) return null;

  const headerButton = (
    <button
      onClick={() => user ? handleLogout() : setShowModal(true)}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
      style={{
        color: user ? '#4ade80' : '#f59e0b',
        background: user ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
        border: '1px solid',
        borderColor: user ? 'rgba(74,222,128,0.3)' : 'rgba(245,158,11,0.3)',
        cursor: 'pointer',
      }}
      title={user ? `${user.email} (Clique para sair)` : 'Fazer login para salvar na nuvem'}
    >
      {checking ? (
        <Loader2 size={12} className="animate-spin" />
      ) : user ? (
        <>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email.split('@')[0]}
          </span>
        </>
      ) : (
        <>
          <Cloud size={12} />
          <span>Nuvem</span>
        </>
      )}
    </button>
  );

  const loginOverlay = showModal && (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#111',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowModal(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <Film size={28} style={{ color: '#ccee00' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-ui, sans-serif)', margin: 0 }}>
            CineWeave
          </h1>
        </div>

        <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>
          Salve seus roteiros, gravações e fichas<br />na nuvem. Acesse de qualquer dispositivo.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                padding: '10px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#ccee00'}
              onBlur={e => e.target.style.borderColor = '#333'}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              style={{
                padding: '10px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#ccee00'}
              onBlur={e => e.target.style.borderColor = '#333'}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '8px 10px', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              background: '#ccee00',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '14px',
            padding: '8px',
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onMouseEnter={e => e.target.style.color = '#ccee00'}
          onMouseLeave={e => e.target.style.color = '#666'}
        >
          {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
        </button>

        <button
          onClick={() => setShowModal(false)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            background: 'none',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#888',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Continuar Offline (Sem Login)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {headerButton}
      {loginOverlay}
    </>
  );
}
