import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Film, Loader2, Mail, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, username || email.split('@')[0]);
      }
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 38px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const inputFocus = (e) => { e.target.style.borderColor = '#ccee00'; e.target.style.boxShadow = '0 0 0 2px rgba(204,238,0,0.15)'; };
  const inputBlur = (e) => { e.target.style.borderColor = '#333'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="login-container" style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #000000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '0 1rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #ccee00 0%, #a0b800 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Film size={24} style={{ color: '#000' }} />
          </div>
        </div>
        <h1 className="login-title" style={{
          fontSize: '28px', fontWeight: '800', color: '#fff',
          textAlign: 'center', margin: '0 0 4px',
          fontFamily: 'var(--font-ui, sans-serif)',
          letterSpacing: '-0.02em',
        }}>
          CineWeave
        </h1>
        <p style={{
          fontSize: '13px', color: '#666',
          textAlign: 'center', margin: '0 0 32px',
        }}>
          {mode === 'login' ? 'Entre para continuar' : 'Crie sua conta gratuita'}
        </p>

        {/* Card */}
        <div className="login-card" style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  style={inputStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Senha (mín. 6 caracteres)"
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p style={{
                fontSize: '12px', color: '#f87171',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '8px', padding: '10px 12px', margin: 0, lineHeight: '1.4',
              }}>
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
                padding: '12px',
                background: '#ccee00',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <button
            onClick={toggleMode}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '16px',
              padding: '8px',
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = '#ccee00'}
            onMouseLeave={e => e.target.style.color = '#666'}
          >
            {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
          </button>
        </div>

        <p style={{
          fontSize: '11px', color: '#444',
          textAlign: 'center', marginTop: '24px',
        }}>
          Ao continuar, você concorda com os Termos de Uso
        </p>
      </div>
    </div>
  );
}
