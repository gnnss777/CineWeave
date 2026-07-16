import React from 'react';

export default function VersionBadge({ count, onClick }) {
  if (!count || count === 0) return null;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '18px',
        height: '18px',
        padding: '0 5px',
        marginLeft: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#000',
        background: '#ccee00',
        borderRadius: '9px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 0 8px rgba(204,238,0,0.6)',
        animation: 'versionBadgePulse 2s ease-in-out infinite',
        verticalAlign: 'middle',
        lineHeight: '18px',
      }}
      title={`${count} atualização(ões) pendente(s)`}
    >
      {count}
    </span>
  );
}
