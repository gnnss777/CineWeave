import React, { useState } from 'react';

const DEFAULT_COLORS = [
  '#ccee00', '#f59e0b', '#4ade80', '#818cf8', '#f87171',
  '#2dd4bf', '#fb923c', '#a78bfa', '#34d399', '#f472b6',
  '#38bdf8', '#e879f9', '#fbbf24', '#86efac', '#c4b5fd',
];

export function hashId(id) {
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(profile) {
  if (profile?.avatar_color) return `#${profile.avatar_color.replace('#', '')}`;
  return DEFAULT_COLORS[hashId(profile?.id || '') % DEFAULT_COLORS.length];
}

export function getInitials(profile) {
  const name = profile?.display_name || profile?.username || '';
  if (!name) return '';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  let initials = '';
  for (let i = 0; i < Math.min(parts.length, 3); i++) {
    initials += parts[i][0];
  }
  if (initials.length < 3) initials = name.replace(/[\s._-]/g, '').substring(0, 3).toUpperCase();
  return initials.toUpperCase();
}

export default function Avatar({ profile, user, size = 48, className, style: extStyle }) {
  const p = profile || user;
  const color = getAvatarColor(p);
  const initials = getInitials(p);
  const [imgError, setImgError] = useState(false);

  const showImg = p?.avatar_url && !imgError;

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        border: `2px solid ${color}`, overflow: 'hidden', position: 'relative', ...extStyle,
      }}
    >
      {showImg ? (
        <img
          src={p.avatar_url}
          alt={initials || 'avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', position: 'absolute', inset: 0 }}
          onError={() => setImgError(true)}
        />
      ) : null}
      <span style={{
        fontSize: size * 0.36, fontWeight: '700', color: '#000', lineHeight: 1, zIndex: 1,
      }}>
        {initials || '?'}
      </span>
    </div>
  );
}
