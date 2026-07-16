import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getStats } from '../lib/diffEngine/sceneDiff';
import { Clock, GitCommit, GitBranch, Bot, User, Bookmark, Download, AlertTriangle, Check, X, GitCompare, RotateCcw } from 'lucide-react';

const VERSION_META = {
  ai:      { icon: Bot,       color: '#ccee00', label: 'IA',      desc: 'Gerado pela IA' },
  user:    { icon: User,      color: '#3b82f6', label: 'Edição',   desc: 'Editado pelo usuário' },
  auto:    { icon: Clock,     color: '#7c7c82', label: 'Auto',     desc: 'Salvamento automático' },
  manual:  { icon: Bookmark,  color: '#10b981', label: 'Versão',  desc: 'Versão manual' },
  import:  { icon: Download,  color: '#f59e0b', label: 'Import',  desc: 'Importação' },
  backup:  { icon: RotateCcw, color: '#f87171', label: 'Backup',  desc: 'Backup de segurança' }
};

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function VersioningTab() {
  const {
    currentProject,
    saveVersion,
    restoreVersion,
    approveStaging,
    approveStagingPartial,
    rejectStaging,
    getVersionScreenplay,
    compareVersions,
    compareWithStaging
  } = useProject();

  const versions = currentProject?.versions;
  const allVersions = versions?.all || [];
  const staging = versions?.staging || [];
  const headId = versions?.head;

  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [mode, setMode] = useState('view'); // view | compare | staging
  const [selectedStagingId, setSelectedStagingId] = useState(null);
  const [versionName, setVersionName] = useState('');

  useEffect(() => {
    if (staging.length > 0 && !selectedStagingId) {
      setSelectedStagingId(staging[0].id);
      setMode('staging');
    } else if (staging.length === 0 && selectedStagingId) {
      setSelectedStagingId(null);
      if (mode === 'staging') setMode('view');
    }
  }, [staging.length, selectedStagingId, mode]);

  const currentVersion = useMemo(() => {
    return allVersions.find(v => v.id === selectedVersionId);
  }, [allVersions, selectedVersionId]);

  const currentVersionScreenplay = useMemo(() => {
    if (!selectedVersionId) return [];
    return getVersionScreenplay(selectedVersionId);
  }, [selectedVersionId, getVersionScreenplay, versions]);

  const versionStats = useMemo(() => {
    return getStats(currentVersionScreenplay);
  }, [currentVersionScreenplay]);

  const diffResult = useMemo(() => {
    if (mode === 'compare' && selectedVersionId && headId) {
      return compareVersions(headId, selectedVersionId);
    }
    if (mode === 'staging' && selectedStagingId) {
      return compareWithStaging(selectedStagingId);
    }
    return null;
  }, [mode, selectedVersionId, selectedStagingId, headId, compareVersions, compareWithStaging]);

  const headVersion = useMemo(() => {
    return allVersions.find(v => v.id === headId);
  }, [allVersions, headId]);

  const handleSaveVersion = () => {
    saveVersion(versionName || undefined);
    setVersionName('');
  };

  const handleRestore = () => {
    if (!selectedVersionId) return;
    if (confirm('Restaurar esta versão? O estado atual será salvo como backup.')) {
      restoreVersion(selectedVersionId);
    }
  };

  const handleApproveStagingPartial = (selections) => {
    if (!selectedStagingId) return;
    const v = approveStagingPartial(selectedStagingId, selections);
    if (v) {
      setSelectedStagingId(null);
      setMode('view');
      setSelectedVersionId(v.id);
    }
  };

  const handleApproveStaging = () => {
    if (!selectedStagingId) return;
    const v = approveStaging(selectedStagingId);
    if (v) {
      setSelectedStagingId(null);
      setMode('view');
      setSelectedVersionId(v.id);
    }
  };

  const handleRejectStaging = () => {
    if (!selectedStagingId) return;
    if (confirm('Rejeitar estas mudanças? Elas serão descartadas permanentemente.')) {
      rejectStaging(selectedStagingId);
      setSelectedStagingId(null);
      setMode('view');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#0a0a0d', color: '#fff' }}>
      {/* ── Timeline Sidebar ── */}
      <div style={{ width: '320px', minWidth: '320px', borderRight: '1px solid #1d1d24', overflow: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <GitBranch size={18} style={{ color: '#ccee00' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ccee00', margin: 0 }}>Versionamento</h2>
        </div>

        {/* Quick save version */}
        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(204,238,0,0.05)', border: '1px solid rgba(204,238,0,0.15)', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#737373', marginBottom: '6px' }}>Salvar versão manual agora:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              placeholder="Nome da versão..."
              style={{ flex: 1, padding: '6px 10px', background: '#151515', border: '1px solid #1d1d24', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
            />
            <button onClick={handleSaveVersion} style={{ padding: '6px 12px', background: '#ccee00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
              Salvar
            </button>
          </div>
        </div>

        {/* Pending staging */}
        {staging.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pendentes ({staging.length})
              </span>
            </div>
            {staging.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelectedStagingId(s.id); setMode('staging'); }}
                style={{
                  padding: '10px 12px',
                  marginBottom: '6px',
                  background: selectedStagingId === s.id && mode === 'staging' ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${selectedStagingId === s.id && mode === 'staging' ? '#f59e0b' : 'rgba(245,158,11,0.2)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>{s.name}</div>
                <div style={{ fontSize: '10px', color: '#737373', marginTop: '3px' }}>
                  Fonte: {s.source} · {formatDate(s.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Version timeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <GitCommit size={14} style={{ color: '#737373' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Histórico ({allVersions.length})
          </span>
        </div>
        <div>
          {allVersions.length === 0 && (
            <div style={{ padding: '12px', color: '#737373', fontSize: '12px', fontStyle: 'italic' }}>
              Nenhuma versão salva ainda. Edite o roteiro para gerar versões automáticas.
            </div>
          )}
          {allVersions.map(v => {
            const meta = VERSION_META[v.type] || VERSION_META.auto;
            const Icon = meta.icon;
            const isHead = v.id === headId;
            const isSelected = selectedVersionId === v.id && mode !== 'staging';
            return (
              <div
                key={v.id}
                onClick={() => { setSelectedVersionId(v.id); setMode('view'); }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  background: isSelected ? 'rgba(204,238,0,0.08)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(204,238,0,0.3)' : 'transparent'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative'
                }}
              >
                {isHead && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#ccee00', borderRadius: '2px 0 0 2px' }} />
                )}
                <Icon size={16} style={{ color: meta.color, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px',
                      background: `${meta.color}20`, color: meta.color, textTransform: 'uppercase'
                    }}>
                      {meta.label}
                    </span>
                    {isHead && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', background: '#ccee00', color: '#000' }}>
                        HEAD
                      </span>
                    )}
                    <span style={{ fontSize: '10px', color: '#737373' }}>
                      {formatDate(v.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail / Diff Panel ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {mode === 'staging' && selectedStagingId ? (
          <StagingReview
            stagingId={selectedStagingId}
diffResult={diffResult}
            onApprove={handleApproveStaging}
            onApprovePartial={handleApproveStagingPartial}
            onReject={handleRejectStaging}
          />
        ) : mode === 'compare' && diffResult ? (
          <DiffView diffResult={diffResult} headVersionName={headVersion?.name} targetVersionName={currentVersion?.name} />
        ) : currentVersion ? (
          <VersionDetail
            version={currentVersion}
            screenplay={currentVersionScreenplay}
            stats={versionStats}
            isHead={currentVersion.id === headId}
            onRestore={handleRestore}
            onCompare={() => setMode('compare')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#737373' }}>
            <GitBranch size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '14px' }}>Selecione uma versão na timeline para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VersionDetail({ version, screenplay, stats, isHead, onRestore, onCompare }) {
  const meta = VERSION_META[version.type] || VERSION_META.auto;
  const Icon = meta.icon;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon size={24} style={{ color: meta.color }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{version.name}</h2>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#737373', marginTop: '4px' }}>
            <span style={{ color: meta.color, fontWeight: 'bold' }}>{meta.label}</span>
            <span>{formatDate(version.timestamp)}</span>
            {isHead && <span style={{ color: '#ccee00', fontWeight: 'bold' }}>· Versão atual</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <StatCard label="Palavras" value={stats.words} />
        <StatCard label="Cenas" value={stats.scenes} />
        <StatCard label="Personagens" value={stats.characters} />
        <StatCard label="Diálogos" value={stats.dialogues} />
        <StatCard label="Ações" value={stats.actions} />
        <StatCard label="Blocos" value={stats.blocks} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {!isHead && (
          <button onClick={onRestore} style={{ padding: '8px 16px', background: '#ccee00', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={14} /> Restaurar esta versão
          </button>
        )}
        {!isHead && (
          <button onClick={onCompare} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitCompare size={14} /> Comparar com atual
          </button>
        )}
        {isHead && (
          <div style={{ padding: '8px 16px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', borderRadius: '10px', fontSize: '12px', color: '#ccee00', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} /> Esta é a versão atual (HEAD)
          </div>
        )}
      </div>

      {/* Screenplay preview */}
      <div style={{ background: 'rgba(20,20,20,0.5)', border: '1px solid #1d1d24', borderRadius: '12px', padding: '20px', fontFamily: "'Courier Prime', Courier, monospace", fontSize: '13px', lineHeight: '1.8', maxHeight: '60vh', overflow: 'auto' }}>
        {screenplay.length === 0 ? (
          <p style={{ color: '#737373', fontStyle: 'italic' }}>Versão vazia.</p>
        ) : (
          screenplay.map((block, i) => (
            <BlockPreview key={block.id || i} block={block} />
          ))
        )}
      </div>
    </div>
  );
}

function BlockPreview({ block }) {
  const indent = {
    'scene-heading': '0',
    'action': '0',
    'character': '2.5in',
    'parenthetical': '2in',
    'dialogue': '1.5in',
    'transition': '3.5in',
    'section': '0',
    'synopsis': '0'
  };
  const style = {
    'scene-heading': { fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#ccee00' },
    'character': { textTransform: 'uppercase', color: '#f59e0b', marginTop: '12px' },
    'parenthetical': { color: '#737373', fontStyle: 'italic' },
    'transition': { textTransform: 'uppercase', color: '#737373', textAlign: 'right', marginTop: '12px' },
    'action': { color: '#e0e0e5', marginBottom: '8px' },
    'dialogue': { color: '#e0e0e5' },
  };
  return (
    <div style={{ marginLeft: indent[block.type] || '0', ...(style[block.type] || {}) }}>
      {block.text}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ padding: '10px 16px', background: 'rgba(20,20,20,0.6)', border: '1px solid #1d1d24', borderRadius: '10px', minWidth: '80px' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ccee00' }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function DiffView({ diffResult, headVersionName, targetVersionName }) {
  const { changes, stats } = diffResult;
  if (!changes || changes.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize: '16px', color: '#ccee00', marginBottom: '12px' }}>
          <GitCompare size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Comparação: sem diferenças
        </h2>
        <p style={{ color: '#737373', fontSize: '13px' }}>
          As versões "{headVersionName}" e "{targetVersionName}" são idênticas.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '16px', color: '#ccee00', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GitCompare size={18} />
        Comparar Versões
      </h2>
      <div style={{ fontSize: '12px', color: '#737373', marginBottom: '16px' }}>
        <span style={{ color: '#ccee00' }}>{headVersionName}</span> → <span style={{ color: '#ccee00' }}>{targetVersionName}</span>
      </div>

      {/* Diff stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Adicionados" value={stats.added} />
        <StatCard label="Removidos" value={stats.removed} />
        <StatCard label="Modificados" value={stats.modified} />
        <StatCard label="Iguais" value={stats.unchanged} />
      </div>

      {/* Changes */}
      <div style={{ fontFamily: "'Courier Prime', Courier, monospace", fontSize: '13px', lineHeight: '1.6' }}>
        {changes.map((c, i) => {
          if (c.type === 'added' && c.block) {
            return (
              <div key={i} style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981', padding: '6px 12px', marginBottom: '4px', borderRadius: '0 6px 6px 0' }}>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>+ ADICIONADO</span>
                <div style={{ marginTop: '4px' }}><BlockPreview block={c.block} /></div>
              </div>
            );
          }
          if (c.type === 'removed' && c.block) {
            return (
              <div key={i} style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444', padding: '6px 12px', marginBottom: '4px', borderRadius: '0 6px 6px 0', opacity: 0.7 }}>
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>− REMOVIDO</span>
                <div style={{ marginTop: '4px', textDecoration: 'line-through' }}><BlockPreview block={c.block} /></div>
              </div>
            );
          }
          if (c.type === 'modified') {
            return (
              <div key={i} style={{ background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid #f59e0b', padding: '6px 12px', marginBottom: '4px', borderRadius: '0 6px 6px 0' }}>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>~ MODIFICADO</span>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <div style={{ flex: 1, opacity: 0.6 }}>
                    {c.oldBlock && <BlockPreview block={c.oldBlock} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    {c.newBlock && <BlockPreview block={c.newBlock} />}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function StagingReview({ stagingId, diffResult, onApprove, onApprovePartial, onReject }) {
  const { changes, stats } = diffResult || { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
  const [selections, setSelections] = useState({});

  useEffect(() => {
    const initial = {};
    changes.forEach((c, i) => { initial[i] = true; });
    setSelections(initial);
  }, [stagingId, changes.length]);

  const toggleBlock = (i) => {
    setSelections(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const acceptedCount = Object.values(selections).filter(Boolean).length;
  const rejectedCount = changes.length - acceptedCount;

  const handleSubmitPartial = () => {
    onApprovePartial(selections);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
            Atualização Pendente
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: '#737373', maxWidth: '600px' }}>
          Revise as mudanças abaixo. Você pode aprovar tudo, ou selecionar bloco por bloco.
          O roteiro só será atualizado quando você clicar em aprovar.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <StatCard label="Adicionados" value={stats.added} />
        <StatCard label="Removidos" value={stats.removed} />
        <StatCard label="Modificados" value={stats.modified} />
        <StatCard label="Sem mudança" value={stats.unchanged} />
        <StatCard label="Aceitos" value={acceptedCount} />
        <StatCard label="Rejeitados" value={rejectedCount} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button onClick={onApprove} style={{ padding: '10px 20px', background: '#ccee00', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={16} /> Aprovar Tudo
        </button>
        <button onClick={handleSubmitPartial} style={{ padding: '10px 20px', background: 'rgba(204,238,0,0.08)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={16} /> Aprovar Selecionados ({acceptedCount})
        </button>
        <button onClick={onReject} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <X size={16} /> Rejeitar Tudo
        </button>
      </div>

      {/* Diff changes */}
      {changes.length === 0 ? (
        <p style={{ color: '#737373', fontStyle: 'italic', fontSize: '13px' }}>Nenhuma mudança encontrada.</p>
      ) : (
        <div style={{ fontFamily: "'Courier Prime', Courier, monospace", fontSize: '13px', lineHeight: '1.6' }}>
          {changes.map((c, i) => {
            const isAccepted = selections[i] !== false;
            const handleToggle = () => toggleBlock(i);
            return (
              <div key={i} style={{
                position: 'relative',
                borderLeft: `3px solid ${
                  c.type === 'added' ? '#10b981' :
                  c.type === 'removed' ? '#ef4444' : '#f59e0b'
                }`,
                background: isAccepted ?
                  (c.type === 'added' ? 'rgba(16,185,129,0.08)' :
                   c.type === 'removed' ? 'rgba(239,68,68,0.08)' :
                   'rgba(245,158,11,0.08)') :
                  'rgba(20,20,20,0.3)',
                padding: '8px 14px 8px 50px',
                marginBottom: '6px',
                borderRadius: '0 8px 8px 0',
                transition: 'opacity 0.15s',
                opacity: isAccepted ? 1 : 0.4
              }}>
                {/* Toggle button */}
                <button
                  onClick={handleToggle}
                  title={isAccepted ? 'Rejeitar este bloco' : 'Aceitar este bloco'}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isAccepted ? '#ccee00' : 'transparent',
                    border: isAccepted ? 'none' : '1px solid #737373',
                    color: isAccepted ? '#000' : '#737373',
                    transition: 'all 0.15s'
                  }}
                >
                  {isAccepted ? <Check size={16} /> : <X size={16} />}
                </button>

                <span style={{ fontSize: '10px', fontWeight: 'bold', color:
                  c.type === 'added' ? '#10b981' :
                  c.type === 'removed' ? '#ef4444' : '#f59e0b'
                }}>
                  {c.type === 'added' ? '+ NOVO BLOCO' :
                   c.type === 'removed' ? '− SERÁ REMOVIDO' : '~ MODIFICADO'}
                </span>

                {c.type === 'added' && c.block && (
                  <div style={{ marginTop: '6px' }}><BlockPreview block={c.block} /></div>
                )}
                {c.type === 'removed' && c.block && (
                  <div style={{ marginTop: '6px', textDecoration: isAccepted ? 'none' : 'line-through' }}>
                    <BlockPreview block={c.block} />
                  </div>
                )}
                {c.type === 'modified' && (
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <div style={{ flex: 1, opacity: 0.6 }}>
                      <span style={{ fontSize: '9px', color: '#737373' }}>ANTES:</span>
                      {c.oldBlock && <BlockPreview block={c.oldBlock} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '9px', color: '#ccee00' }}>DEPOIS:</span>
                      {c.newBlock && <BlockPreview block={c.newBlock} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}