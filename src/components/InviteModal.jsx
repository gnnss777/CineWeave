import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProjectInvitations, inviteUserToProject, findUserByEmail } from '../lib/db';
import Avatar from './Avatar';
import { X, UserPlus, Loader2, Mail, Check, Clock } from 'lucide-react';

function MiniAvatar({ profile, size = 28 }) {
  return <Avatar user={profile} profile={profile} size={size} />;
}

function getInviteeName(inv) {
  const p = inv.profiles;
  if (p?.display_name) return p.display_name;
  if (p?.username) return p.username;
  return inv.user_id?.substring(0, 8) || 'Desconhecido';
}

export default function InviteModal({ projectId, onClose }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchProjectInvitations(projectId)
      .then(data => setInvitations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !projectId || !user) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const found = await findUserByEmail(email.trim());
      if (!found) {
        setError('Usuário não encontrado com este email');
        return;
      }
      await inviteUserToProject(projectId, found.id, 'editor', user.id);
      setSuccess(`Convite enviado para ${found.display_name || found.username || found.id}`);
      setEmail('');
      const updated = await fetchProjectInvitations(projectId);
      setInvitations(updated || []);
    } catch (err) {
      setError(err.message || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: '420px', background: '#111',
        border: '1px solid #222', borderRadius: '16px', padding: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} style={{ color: '#ccee00' }} /> Compartilhar Projeto
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email do colaborador" className="dark-input w-full text-xs" style={{ paddingLeft: '32px' }} />
          </div>
          <button type="submit" disabled={sending || !email.trim()}
            style={{ padding: '10px 16px', background: '#ccee00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: sending ? 'wait' : 'pointer', opacity: sending || !email.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Convidar
          </button>
        </form>

        {error && <p style={{ fontSize: '11px', color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '8px', margin: '0 0 12px' }}>{error}</p>}
        {success && <p style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '8px', margin: '0 0 12px' }}>{success}</p>}

        <h3 style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
          Colaboradores ({invitations.length})
        </h3>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#666', gap: '8px', fontSize: '12px' }}>
            <Loader2 size={14} className="animate-spin" /> Carregando...
          </div>
        ) : invitations.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', padding: '16px' }}>Nenhum colaborador ainda</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {invitations.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MiniAvatar profile={inv.profiles} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                      {getInviteeName(inv)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {inv.status === 'accepted' ? 'Ativo' : inv.status === 'pending' ? 'Pendente' : inv.status}
                      {' · '}{inv.role}
                    </div>
                  </div>
                </div>
                {inv.status === 'pending' && (
                  <div style={{ color: '#f59e0b' }}><Clock size={14} /></div>
                )}
                {inv.status === 'accepted' && (
                  <div style={{ color: '#4ade80' }}><Check size={14} /></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
