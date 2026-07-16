import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { getLLMApiKey, extractEnrichmentFromScreenplay } from '../lib/llm';
import { exportFountain, downloadFountain } from '../lib/fountainExport';
import { parseFountain } from '../lib/fountainImport';
import { parseFile } from '../lib/fileParser';
import { exportScreenplayPDF } from '../lib/pdfExport';
import { linkScreenplayToEntities, parseSceneHeading } from '../lib/entityExtractor';
import { uploadProjectFile } from '../lib/storage';
import * as db from '../lib/db';
import FichaModal from './FichaModal';
import SharedSidebar from './SharedSidebar';
import ConfirmModal from './ConfirmModal';
import CoverageReport from './CoverageReport';
import ScriptBrowser from './ScriptBrowser';
import { 
  User, MapPin, Columns, FileText, Edit3,
  Sparkles, Printer, Plus, Download, Upload,
  X, HelpCircle, BookOpen, Minimize2, 
  Trash2, BarChart2, Cpu, Grid, Layers,
  Compass, ShieldAlert, Award, Target, Heart,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Eye, EyeOff, Filter, ListChecks, Star, Settings2, Circle, AlertTriangle,
  Clock, GitBranch
} from 'lucide-react';
import './ScreenplayTab.css';

function cleanSceneText(text) {
  return (text || '').replace(/\[\[.*?\]\]/g, '').replace(/#([^#]+)#/g, '').trim();
}

function StylePanel({
  open,
  onCollapse,
  revisionFilter,
  setRevisionFilter,
  revisionMode,
  setRevisionMode,
  revisionGeneration,
  setRevisionGeneration,
  revisionCount,
  revisionGroups,
  visibleCount,
  revisions,
  focusBlock,
  toggleRevision,
  clearAllRevisions,
}) {
  const activePanelGen = REVISION_GENERATIONS.find(g => g.level === revisionGeneration) || REVISION_GENERATIONS[0];
  const [expandedScenes, setExpandedScenes] = useState({});
  const setFilterMode = (m) => setRevisionFilter(prev => ({ ...prev, mode: m }));
  const toggleGen = (level) => setRevisionFilter(prev => {
    const hidden = prev.hiddenGens.includes(level)
      ? prev.hiddenGens.filter(x => x !== level)
      : [...prev.hiddenGens, level];
    return { ...prev, hiddenGens: hidden };
  });
  const toggleScene = (key) => setExpandedScenes(prev => ({ ...prev, [key]: !prev[key] }));
  return (
    <div className="style-panel">
      <div className="style-panel-header">
        <div className="style-panel-title">
          <Settings2 size={14} />
          <span>Revisão</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="style-panel-collapse" onClick={onCollapse} title="Fechar painel">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="style-panel-section">
        <div className="style-panel-section-label">
          <ListChecks size={11} />
          <span>Revisões — Sistema Beat</span>
          <span className="style-panel-tag">{visibleCount}/{revisionCount}</span>
        </div>

        <div className="style-panel-toggle-row">
          <button
            className={`style-panel-pill ${revisionMode ? 'on' : ''}`}
            onClick={() => setRevisionMode(v => !v)}
          >
            <span className="style-panel-pill-dot" style={{ background: activePanelGen.color }} />
            {revisionMode ? 'Monitorando' : 'Monitorar'}
          </button>
        </div>

        <div className="style-panel-sublabel">Geração ativa para novas edições</div>
        <div className="style-panel-gen-grid">
          {REVISION_GENERATIONS.map(gen => (
            <button
              key={gen.level}
              className={`style-panel-gen-chip ${revisionGeneration === gen.level ? 'active' : ''}`}
              style={{
                '--gen-color': gen.hex,
                background: revisionGeneration === gen.level ? `rgba(${parseInt(gen.hex.slice(1,3),16)},${parseInt(gen.hex.slice(3,5),16)},${parseInt(gen.hex.slice(5,7),16)},0.18)` : 'transparent',
                borderColor: revisionGeneration === gen.level ? gen.hex : 'rgba(255,255,255,0.08)'
              }}
              onClick={() => setRevisionGeneration(gen.level)}
              title={`${gen.name} (${gen.label})`}
            >
              <span className="style-panel-gen-marker" style={{ color: gen.hex }}>{gen.marker}</span>
              <span className="style-panel-gen-label">{gen.name.replace('Roteiro ', '')}</span>
            </button>
          ))}
        </div>

        <div className="style-panel-sublabel" style={{ marginTop: '10px' }}>Filtro de visualização</div>
        <div className="style-panel-radio-group">
          <button
            className={`style-panel-radio ${revisionFilter.mode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            <Eye size={11} /><span>Todas</span>
          </button>
          <button
            className={`style-panel-radio ${revisionFilter.mode === 'only' ? 'active' : ''}`}
            onClick={() => setFilterMode('only')}
          >
            <Filter size={11} /><span>Só revisões</span>
          </button>
          <button
            className={`style-panel-radio ${revisionFilter.mode === 'hide' ? 'active' : ''}`}
            onClick={() => setFilterMode('hide')}
          >
            <EyeOff size={11} /><span>Ocultar</span>
          </button>
        </div>

        <div className="style-panel-sublabel" style={{ marginTop: '10px' }}>Ocultar gerações</div>
        <div className="style-panel-gen-grid">
          {REVISION_GENERATIONS.map(gen => {
            const isHidden = revisionFilter.hiddenGens.includes(gen.level);
            return (
              <button
                key={gen.level}
                className={`style-panel-gen-chip ${isHidden ? 'muted' : ''}`}
                style={{
                  '--gen-color': gen.hex,
                  borderColor: isHidden ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
                  opacity: isHidden ? 0.4 : 1
                }}
                onClick={() => toggleGen(gen.level)}
                title={isHidden ? `Mostrar ${gen.name}` : `Ocultar ${gen.name}`}
              >
                <span className="style-panel-gen-marker" style={{ color: gen.hex }}>{gen.marker}</span>
                <span className="style-panel-gen-label">{gen.name.replace('Roteiro ', '')}</span>
              </button>
            );
          })}
        </div>

        <div className="style-panel-sublabel" style={{ marginTop: '12px' }}>Revisões detectadas</div>
        {revisionGroups.length === 0 ? (
          <div className="style-panel-empty">
            <Star size={18} />
            <span>{revisionMode ? 'Nenhuma alteração capturada ainda. Edite blocos no editor.' : 'Modo revisão desligado — ative para começar a monitorar.'}</span>
          </div>
        ) : (
          <div className="style-panel-revision-list">
            {revisionGroups.map((group, gi) => {
              const key = `${group.scene.index}::${group.scene.heading}`;
              const expanded = expandedScenes[key] !== false;
              const visibleItems = group.items.filter(i => !revisionFilter.hiddenGens.includes(i.gen));
              if (visibleItems.length === 0) return null;
              return (
                <div key={key} className="style-panel-revision-group">
                  <button
                    className="style-panel-revision-scene"
                    onClick={() => {
                      toggleScene(key);
                      const first = visibleItems[0];
                      if (first) focusBlock(first.id, 'start');
                    }}
                  >
                    {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    <span className="style-panel-revision-scene-num">#{group.scene.sceneNumber}</span>
                    <span className="style-panel-revision-scene-title">{group.scene.heading}</span>
                    <span className="style-panel-revision-count">{visibleItems.length}</span>
                  </button>
                  {expanded && (
                    <div className="style-panel-revision-items">
                      {visibleItems.map(item => {
                        const gen = REVISION_GENERATIONS.find(g => g.level === item.gen) || REVISION_GENERATIONS[0];
                        return (
                          <div key={item.id} className="style-panel-revision-row">
                            <span
                              className="style-panel-revision-pin"
                              style={{ background: gen.hex, color: '#000' }}
                              title={`${gen.name} (${gen.label})`}
                            >
                              {gen.marker}
                            </span>
                            <button
                              className="style-panel-revision-text"
                              onClick={() => focusBlock(item.id, 'start')}
                              title="Ir para o bloco"
                            >
                              {item.text.length > 70 ? `${item.text.slice(0, 70)}…` : item.text}
                            </button>
                            <button
                              className="style-panel-revision-remove"
                              onClick={() => toggleRevision(item.id)}
                              title="Remover desta revisão"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {visibleCount > 0 && (
              <button className="style-panel-clear-all" onClick={clearAllRevisions} title="Limpar todas as marcações">
                <Trash2 size={11} /><span>Limpar todas as revisões</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Beat‑compatible 8‑level Production Revision System ── */
const REVISION_GENERATIONS = [
  { level: 0, name: 'Roteiro Branco',   color: '#3b82f6', marker: '*',  hex: '#3b82f6', label: 'Blue Revision' },
  { level: 1, name: 'Roteiro Rosa',     color: '#ec4899', marker: '**', hex: '#ec4899', label: 'Pink Revision' },
  { level: 2, name: 'Roteiro Amarelo',  color: '#f59e0b', marker: '+',  hex: '#f59e0b', label: 'Yellow Revision' },
  { level: 3, name: 'Roteiro Verde',    color: '#10b981', marker: '++', hex: '#10b981', label: 'Green Revision' },
  { level: 4, name: 'Roteiro Dourado',  color: '#d4a359', marker: '@',  hex: '#d4a359', label: 'Goldenrod Revision' },
  { level: 5, name: 'Roteiro Creme',    color: '#f3f4f6', marker: '@@', hex: '#f3f4f6', label: 'Buff Revision' },
  { level: 6, name: 'Roteiro Salmão',   color: '#f87171', marker: '#',  hex: '#f87171', label: 'Rose Revision' },
  { level: 7, name: 'Roteiro Cereja',   color: '#be123c', marker: '##', hex: '#be123c', label: 'Cherry Revision' },
];

const BEAT_BLOCK_RE = /\/\*\s*BEAT:\s*({[\s\S]*?})\s*END_BEAT\s*\*\//;

const parseBeatMetadata = (screenplay) => {
  if (!screenplay || !screenplay.length) return {};
  const last = screenplay[screenplay.length - 1];
  if (!last || last.type !== 'beat-metadata') return {};
  const match = last.text.match(BEAT_BLOCK_RE);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
};

const generateBeatBlock = (metadata) => {
  const json = JSON.stringify(metadata, null, 2);
  return `/* If you're seeing this, you can remove the following stuff - BEAT:\n${json}\nEND_BEAT*/`;
};

function VersionPanelView({ onClose }) {
  const { currentProject, saveVersion, restoreVersion, approveStaging, rejectStaging, getPendingStagingCount } = useProject();
  const versions = currentProject?.versions;
  const allVersions = versions?.all || [];
  const staging = versions?.staging || [];
  const pendingCount = getPendingStagingCount();
  const [versionName, setVersionName] = useState('');

  return (
    <div className="flex flex-col gap-4">
      {staging.length > 0 && (
        <div className="glass p-4 border border-yellow-500/30 rounded-xl">
          <h4 className="text-xs font-bold text-yellow-500 mb-3 flex items-center gap-1">
            <AlertTriangle size={12} /> {pendingCount} alteração(ões) pendente(s)
          </h4>
          <div className="flex gap-2">
            <button onClick={() => { approveStaging(); }} className="btn-primary py-1 px-3 text-xs">Aprovar Todas</button>
            <button onClick={() => { rejectStaging(); }} className="btn-secondary py-1 px-3 text-xs">Rejeitar Todas</button>
          </div>
        </div>
      )}
      <div className="glass p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-white">Salvar Versão</h4>
        <div className="flex gap-2">
          <input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Nome da versão..." className="p-2 border border-white/10 rounded-md text-xs text-white flex-1 focus:outline-none focus:border-yellow-500" style={{ background: 'var(--bg-input)' }} />
          <button onClick={() => { saveVersion(versionName); setVersionName(''); }} className="btn-primary py-1 px-3 text-xs">Salvar</button>
        </div>
      </div>
      {allVersions.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-bold text-gray-500 mb-1">Histórico ({allVersions.length})</h4>
          {allVersions.slice(-10).reverse().map(v => (
            <div key={v.id} className="glass p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-200">{v.name}</span>
                <span className="text-[10px] text-gray-500 ml-2">{new Date(v.timestamp).toLocaleDateString('pt-BR')}</span>
              </div>
              <button onClick={() => restoreVersion(v.id)} className="btn-secondary py-0.5 px-2 text-[10px]">Restaurar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScreenplayTab() {
  const {
    currentProject,
    currentProjectId,
    updateScreenplay,
    saveCharacter,
    saveLocation,
    saveObject,
    deleteCharacter,
    deleteLocation,
    deleteObject,
    saveEntity,
    deleteEntityById,
    navigateTo,
    tabNavigation,
    importScreenplayWithEntities,
    enrichWithLLM,
    updateProject,
    stageProposedChanges,
    setProjects,
    getPendingStagingCount
  } = useProject();

  const [elements, setElements] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);

  /* ── Typewriter scroll manager ── */
  const typewriterRef = useRef(null);
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (!typewriterMode) { typewriterRef.current = null; return; }
    const container = document.querySelector('.editor-container');
    if (!container) return;
    scrollContainerRef.current = container;
    const handler = () => {
      const active = document.activeElement;
      if (!active || !container.contains(active)) return;
      const rect = active.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height / 2;
      const offset = rect.top - centerY + rect.height / 2;
      if (Math.abs(offset) > 50) {
        container.scrollBy({ top: offset, behavior: 'smooth' });
      }
    };
    // Initial centering
    requestAnimationFrame(handler);
    // Re-center on selection changes
    document.addEventListener('selectionchange', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      typewriterRef.current = null;
    };
  }, [typewriterMode]);

  const [sidebarTab, setSidebarTab] = useState('outliner');
  const [sidebarPosition, setSidebarPosition] = useState('right');
  const [fichaModal, setFichaModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [coverageModal, setCoverageModal] = useState(false);
  const [classicScriptsModal, setClassicScriptsModal] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showCompileModal, setShowCompileModal] = useState(false);
  const [aiTone, setAiTone] = useState('dramatico');

  /* ── Beat‑compatible Revision Mode ── */
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionGeneration, setRevisionGeneration] = useState(0);
  const [revisions, setRevisions] = useState([]);

  /* ── Print / Style panel state ── */
  const [printMode, setPrintMode] = useState(false);
  const [stylePanelOpen, setStylePanelOpen] = useState(true);
  const [revisionFilter, setRevisionFilter] = useState({ mode: 'all', hiddenGens: [] });

  /* ── Page View Mode ── */
  const [pageViewMode, setPageViewMode] = useState('continuous'); // 'continuous' | 'paginated'
  const [currentPage, setCurrentPage] = useState(1);

  const [autocomplete, setAutocomplete] = useState({
    show: false, suggestions: [], index: 0, x: 0, y: 0, blockId: '', type: '' 
  });

  const [activeBlockMenu, setActiveBlockMenu] = useState({ show: false, blockId: '', index: 0, x: 0, y: 0 });

  /* ── Simulated Plugins ── */
  const [selectedPlugin, setSelectedPlugin] = useState('linter');
  const [pluginLog, setPluginLog] = useState([]);
  const [pluginRunning, setPluginRunning] = useState(false);

  const elementRefs = useRef({});
  const autocompleteRef = useRef(null);
  const blockTexts = useRef({});
  const ceInitSet = useRef(new Set());
  const fountainInputRef = useRef(null);
  const [pendingAutoTypes, setPendingAutoTypes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);
  const [activeSceneIdx, setActiveSceneIdx] = useState(-1);

  /* ── Search matches ── */
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return elements
      .map((el, idx) => ({ ...el, originalIndex: idx }))
      .filter(el => el.text?.toLowerCase().includes(q))
      .map(el => el.id);
  }, [elements, searchQuery]);

  const performSearch = useCallback((dir = 1) => {
    if (searchMatches.length === 0) return;
    let next = searchMatchIdx + dir;
    if (next < 0) next = searchMatches.length - 1;
    if (next >= searchMatches.length) next = 0;
    setSearchMatchIdx(next);
    const id = searchMatches[next];
    const el = elementRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchMatches, searchMatchIdx]);

  /* ── Scene headings list for minimap + jump ── */
  const sceneHeadings = useMemo(() => {
    return elements
      .map((el, idx) => ({ ...el, originalIndex: idx }))
      .filter(el => (pendingAutoTypes[el.id] || el.type) === 'scene-heading');
  }, [elements, pendingAutoTypes]);

  /* ── IntersectionObserver for minimap highlight ── */
  const sceneObserverRef = useRef(null);
  useEffect(() => {
    sceneObserverRef.current?.disconnect();
    const obs = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let maxIdx = -1;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          const idx = sceneHeadings.findIndex(sh => sh.id === entry.target.dataset.sceneId);
          if (idx >= 0) { maxRatio = entry.intersectionRatio; maxIdx = idx; }
        }
      });
      if (maxIdx >= 0) setActiveSceneIdx(maxIdx);
    }, { rootMargin: '-80px 0px -60% 0px' });

    sceneHeadings.forEach(sh => {
      const el = elementRefs.current[sh.id];
      if (el) {
        el.dataset.sceneId = sh.id;
        obs.observe(el);
      }
    });
    sceneObserverRef.current = obs;
    return () => obs.disconnect();
  }, [sceneHeadings]);

  const handleFountainExport = () => {
    const content = exportFountain(currentProject);
    downloadFountain(content, currentProject?.title || 'roteiro');
  };

  const handlePDFExport = () => {
    exportScreenplayPDF(currentProject);
  };

  const handleFountainImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    
    let fileStorageRecord = null;
    
    try {
      // Upload file to Storage
      const importType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'fountain';
      try {
        const { getCurrentUser } = await import('../lib/supabase');
        const user = await getCurrentUser();
        if (user && currentProject?.id) {
          const uploadResult = await uploadProjectFile(currentProject.id, user.id, file, 'screenplay');
          if (uploadResult) {
            // Save project_files record in DB
            const savedFile = await db.saveProjectFile(user.id, currentProject.id, {
              ...uploadResult,
              source: 'screenplay',
            });
            if (savedFile) {
              fileStorageRecord = savedFile;
              // Track in project state
              const proj = { ...currentProject };
              if (!proj.projectFiles) proj.projectFiles = [];
              proj.projectFiles.push({ ...uploadResult, id: savedFile.id, _sbSynced: true });
              updateProject(proj);
            }
          }
        }
      } catch (uploadErr) {
        console.warn('[FountainImport] File upload failed (non-fatal):', uploadErr);
      }

      let fountainText;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const parsed = await parseFile(file);
        fountainText = parsed.text;
      } else {
        fountainText = await file.text();
      }
      const imported = parseFountain(fountainText);
      console.log('[FountainImport] elements:', imported);
      console.log('[FountainImport] element types:', imported.map(el => `${el.type}: "${el.text?.slice(0, 60)}"`));
      const result = importScreenplayWithEntities(imported);
      console.log('[FountainImport] extracted entity counts:', result);

      // Save screenplay import record
      try {
        const { getCurrentUser } = await import('../lib/supabase');
        const user = await getCurrentUser();
        if (user && currentProject?.id) {
          await db.saveScreenplayImport(user.id, currentProject.id, {
            fileId: fileStorageRecord?.id || null,
            originalFilename: file.name,
            importType,
            elementCount: imported.length,
            metadata: { entityCounts: result },
          });
        }
      } catch (importRecErr) {
        console.warn('[FountainImport] Failed to save import record:', importRecErr);
      }

      const lines = [];
      if (result?.characters) lines.push(`• ${result.characters} ficha(s) de personagem`);
      if (result?.locations) lines.push(`• ${result.locations} locação(ões)`);
      if (result?.scenes) lines.push(`• ${result.scenes} cena(s)`);
      if (result?.acts) lines.push(`• ${result.acts} ato(s)`);
      const fountainSummary = lines.length > 0
        ? `Foram criadas automaticamente:\n\n${lines.join('\n')}`
        : 'Roteiro importado. Elementos foram parseados e estão prontos para edição.';

      const hasKey = !!getLLMApiKey();
      if (!hasKey) {
        setConfirmModal({
          title: 'Roteiro importado com sucesso',
          message: `${fountainSummary}\n\nPara extrair objetos, plot points e temas via IA, configure a chave da API NVIDIA nas configurações.`,
          variant: 'success',
          confirmLabel: 'OK',
          onConfirm: () => setConfirmModal(null),
          onCancel: () => setConfirmModal(null),
        });
        return;
      }

      setConfirmModal({
        title: 'Extraindo objetos, plot points e temas...',
        message: 'Roteiro importado. Agora a IA está analisando o texto para extrair objetos, plot points e temas.\n\nIsso pode levar alguns segundos...',
        variant: 'alert',
        confirmLabel: 'Aguarde',
        onConfirm: () => {},
        onCancel: () => {},
      });

      try {
        const llmResult = await extractEnrichmentFromScreenplay(fountainText, (status) => {
          setConfirmModal(prev => prev ? { ...prev, message: `Roteiro importado. Status: ${status}` } : prev);
        });
        const enrichResult = enrichWithLLM(llmResult);
        console.log('[FountainImport] LLM enrichment counts:', enrichResult);

        const allLines = [...lines];
        if (enrichResult.objects) allLines.push(`• ${enrichResult.objects} objeto(s)`);
        if (enrichResult.plot_points) allLines.push(`• ${enrichResult.plot_points} plot point(s)`);
        if (enrichResult.themes) allLines.push(`• ${enrichResult.themes} tema(s)`);

        setConfirmModal({
          title: 'Importação completa!',
          message: `${allLines.join('\n')}\n\nTodas as fichas foram criadas na Enciclopédia. Personagens, locais e cenas vieram da análise do roteiro. Objetos, plot points, temas e atos foram extraídos pela IA.`,
          variant: 'success',
          confirmLabel: 'OK',
          onConfirm: () => setConfirmModal(null),
          onCancel: () => setConfirmModal(null),
        });
      } catch (llmErr) {
        console.error('[FountainImport] LLM enrichment failed:', llmErr);
        setConfirmModal({
          title: 'Importação parcial',
          message: `${fountainSummary}\n\nA extração via IA falhou: ${llmErr.message}\n\nVocê pode rodar a extração manualmente no BrainstormTab.`,
          variant: 'alert',
          confirmLabel: 'OK',
          onConfirm: () => setConfirmModal(null),
          onCancel: () => setConfirmModal(null),
        });
      }
    } catch (err) {
      setConfirmModal({
        title: 'Erro ao importar',
        message: `Não foi possível importar o arquivo: ${err.message}`,
        variant: 'alert',
        confirmLabel: 'OK',
        onConfirm: () => setConfirmModal(null),
        onCancel: () => setConfirmModal(null),
      });
    }
  };

  /* Load BEAT metadata on init */
  useEffect(() => {
    if (currentProject) {
      const els = currentProject.screenplay || [];
      setElements(els);
      const meta = parseBeatMetadata(els);
      if (meta['Revision Mode'] !== undefined) setRevisionMode(meta['Revision Mode']);
      if (meta['Revision Level'] !== undefined) setRevisionGeneration(meta['Revision Level']);
      if (meta['PrintMode'] !== undefined) setPrintMode(meta['PrintMode']);
      else if (meta['NovelMode'] !== undefined) setPrintMode(meta['NovelMode']);
    }
  }, [currentProject]);

  const saveScreenplay = (updatedElements) => {
    const entities = currentProject?.entities;
    const withoutMeta = updatedElements.filter(el => el.type !== 'beat-metadata');

    // Use unified linking function
    const linked = linkScreenplayToEntities(withoutMeta, entities);

    // Update entities based on screenplay changes
    const updatedEntities = { ...entities };
    let hasEntityChanges = false;

    linked.forEach(el => {
      if (el.type === 'scene-heading' && el.entityId) {
        const scene = entities?.scenes?.find(s => s.id === el.entityId);
        if (scene && scene.title !== el.text.trim()) {
          const idx = updatedEntities.scenes.findIndex(s => s.id === scene.id);
          if (idx >= 0) {
            updatedEntities.scenes[idx] = { ...scene, title: el.text.trim(), updatedAt: Date.now() };
            hasEntityChanges = true;
          }
        }
      }
      if (el.type === 'character' && el.entityId) {
        const char = entities?.characters?.find(c => c.id === el.entityId);
        const charName = el.text.replace(/\(.*\)/, '').trim();
        if (char && char.name !== charName) {
          const idx = updatedEntities.characters.findIndex(c => c.id === char.id);
          if (idx >= 0) {
            updatedEntities.characters[idx] = { ...char, name: charName, updatedAt: Date.now() };
            hasEntityChanges = true;
          }
        }
        // New location from scene heading
        const parsed = parseSceneHeading(el.text);
        if (parsed && !entities?.locations?.some(l => l.name === parsed.name && l.type === parsed.type)) {
          updatedEntities.locations = updatedEntities.locations || [];
          updatedEntities.locations.push({
            id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: parsed.name,
            type: parsed.type,
            description: '',
            timeOfDay: parsed.timeOfDay,
            mood: '',
            group: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          hasEntityChanges = true;
        }
      }
    });

    // Apply entity updates if any
    if (hasEntityChanges) {
      setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, entities: updatedEntities } : p));
    }

    const meta = {
      'Revision Level': revisionGeneration,
      'Revision Mode': revisionMode,
      'PrintMode': printMode,
      'BlockRevisions': revisions.reduce((acc, id) => { acc[id] = revisionGeneration; return acc; }, {}),
      'DocumentStyle': printMode ? 'print' : 'screenplay'
    };
    const metaBlock = { id: 'beat-metadata', type: 'beat-metadata', text: generateBeatBlock(meta) };
    setElements([...linked, metaBlock]);
    updateScreenplay([...linked, metaBlock]);
  };

  useEffect(() => {
    if (!tabNavigation || tabNavigation.tab !== 'screenplay' || !tabNavigation.targetId) return;
    setActiveTab('editor');
    const targetId = tabNavigation.targetId;
    let targetEl;
    if (elementRefs.current[targetId]) {
      targetEl = elementRefs.current[targetId];
    } else {
      const matched = elements.find(el =>
        el.type === 'character' && el.text && el.text.toLowerCase().includes(targetId.toLowerCase())
      );
      if (matched && elementRefs.current[matched.id]) {
        targetEl = elementRefs.current[matched.id];
      }
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.focus({ preventScroll: true });
      targetEl.style.outline = '2px solid #ccee00';
      targetEl.style.outlineOffset = '2px';
      setTimeout(() => {
        targetEl.style.outline = '';
        targetEl.style.outlineOffset = '';
      }, 2000);
    }
  }, [tabNavigation, elements]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveBlockMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const focusBlock = (blockId, position = 'end') => {
    setTimeout(() => {
      const el = elementRefs.current[blockId];
      if (!el) return;
      el.focus();
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        if (position === 'start') range.collapse(true);
        else if (position === 'end') range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (_) {}
    }, 20);
  };

  const closeAutocomplete = () => {
    setAutocomplete(prev => ({ ...prev, show: false }));
  };

  const applyAutocomplete = (value) => {
    const { blockId, type } = autocomplete;
    const formatted = value.toUpperCase();
    const updated = elements.map(item =>
      item.id === blockId ? { ...item, text: formatted } : item
    );
    saveScreenplay(updated);
    closeAutocomplete();
    focusBlock(blockId, 'end');
    if (type === 'character') {
      const idx = elements.findIndex(el => el.id === blockId);
      const nextEl = elements[idx + 1];
      if (nextEl && (nextEl.type === 'dialogue' || nextEl.type === 'parenthetical')) {
        focusBlock(nextEl.id, 'start');
      } else {
        const newDialogue = {
          id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'dialogue', text: ''
        };
        const updatedWithDialogue = [...updated];
        updatedWithDialogue.splice(idx + 1, 0, newDialogue);
        saveScreenplay(updatedWithDialogue);
        focusBlock(newDialogue.id, 'start');
      }
    }
  };

  const triggerAutocomplete = (id, text, overrideType) => {
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;
    const type = overrideType || currentEl.type;
    if (type === 'character') {
      const query = text.trim().toUpperCase();
      if (query.length > 0) {
        const matching = (currentProject?.entities?.characters || [])
          .filter(c => c.name.toUpperCase().startsWith(query))
          .map(c => c.name);
        if (matching.length > 0) {
          const activeEl = elementRefs.current[id];
          if (activeEl) {
            const rect = activeEl.getBoundingClientRect();
            setAutocomplete({
              show: true, suggestions: matching, index: 0,
              x: rect.left, y: rect.bottom + window.scrollY,
              blockId: id, type: 'character'
            });
          }
        } else { closeAutocomplete(); }
      } else { closeAutocomplete(); }
    } else if (type === 'scene-heading') {
      const query = text.trim().toUpperCase();
      if (query.length > 0) {
        const prefixes = ['INT.', 'EXT.', 'INT./EXT.'];
        const matchedPrefixes = prefixes.filter(p => p.startsWith(query) && p !== query);
        const matchedLocations = (currentProject?.entities?.locations || [])
          .filter(l => l.name.toUpperCase().startsWith(query) || `${l.type} ${l.name}`.toUpperCase().startsWith(query))
          .map(l => `${l.type} ${l.name.toUpperCase()}`);
        const matching = [...matchedPrefixes, ...matchedLocations];
        if (matching.length > 0) {
          const activeEl = elementRefs.current[id];
          if (activeEl) {
            const rect = activeEl.getBoundingClientRect();
            setAutocomplete({
              show: true, suggestions: matching, index: 0,
              x: rect.left, y: rect.bottom + window.scrollY,
              blockId: id, type: 'location'
            });
          }
        } else { closeAutocomplete(); }
      } else { closeAutocomplete(); }
    } else { closeAutocomplete(); }
  };

  /* ── All‑caps‑until‑parenthesis check (Beat‑compatible) ── */
  const isAllCapsUntilParen = (str) => {
    if (!str || str.trim().length < 3) return false;
    let within = false;
    let hasLetter = false;
    for (const ch of str) {
      if (ch === '(') within = true;
      else if (ch === ')') within = false;
      else if (!within && ch.toLowerCase() !== ch.toUpperCase()) {
        hasLetter = true;
        if (ch !== ch.toUpperCase()) return false;
      }
    }
    return hasLetter;
  };

  const getPrevEl = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    return idx > 0 ? { el: elements[idx - 1], index: idx - 1 } : null;
  };
  const getNextEl = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    return idx >= 0 && idx < elements.length - 1 ? { el: elements[idx + 1], index: idx + 1 } : null;
  };

  /* ── Local draft text (no re-render on keystroke) ── */
  const handleInput = (id, text) => {
    blockTexts.current[id] = text;
    if (revisionMode) {
      setRevisions(prev => [...new Set([...prev, id])]);
    }
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;
    const trimmed = text.trim();
    const trimmedUpper = trimmed.toUpperCase();
    const prev = getPrevEl(id);
    const prevEmpty = !prev || !prev.el.text || prev.el.text.trim() === '';
    const next = getNextEl(id);
    const nextEmpty = !next || !next.el.text || next.el.text.trim() === '';

    /* ── @ forced character cue ── */
    if (text.startsWith('@') && currentEl.type !== 'character') {
      const clean = text.slice(1);
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'character' }));
      const el = elementRefs.current[id];
      if (el) el.innerText = clean;
      return;
    }

    /* ── . forced scene heading ── */
    if (text.startsWith('.') && currentEl.type !== 'scene-heading') {
      const clean = text.slice(1);
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'scene-heading' }));
      const el = elementRefs.current[id];
      if (el) el.innerText = clean;
      return;
    }

    /* 1. Scene heading (INT/EXT/I/E, must have empty line before) */
    if (currentEl.type !== 'scene-heading' && prevEmpty) {
      const headingPrefixes = ['INT.', 'EXT.', 'I/E.', 'INT/EXT.', 'INT./EXT.', 'E/I.', 'E./I.'];
      const startsWithPrefix = headingPrefixes.some(p => trimmedUpper.startsWith(p));
      if (startsWithPrefix) {
        const formatted = trimmedUpper;
        blockTexts.current[id] = formatted;
        setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'scene-heading' }));
        const el = elementRefs.current[id];
        if (el && el.innerText !== formatted) el.innerText = formatted;
        triggerAutocomplete(id, formatted, 'scene-heading');
        return;
      }
    }

    /* 2. Transition (> prefix) */
    if (currentEl.type !== 'transition' && text.startsWith('>')) {
      const clean = text.replace(/^>/, '').toUpperCase();
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'transition' }));
      const el = elementRefs.current[id];
      if (el && el.innerText !== clean) el.innerText = clean;
      return;
    }

    /* 3. Transition (all-caps + ends with TO:, preceded by empty) */
    if (currentEl.type !== 'transition' && prevEmpty && isAllCapsUntilParen(trimmed) && / TO:$/.test(trimmed.toUpperCase())) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'transition' }));
      triggerAutocomplete(id, text, 'transition');
      return;
    }

    /* 4. Character (all-caps, ≥3 chars, preceded by empty, next NOT empty) */
    if (currentEl.type !== 'character' && prevEmpty && !nextEmpty && isAllCapsUntilParen(trimmed)) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'character' }));
      triggerAutocomplete(id, text, 'character');
      return;
    }

    /* 5. Parenthetical (starts with (, previous is char/dialogue/paren and not empty) */
    const dialogueBlockTypes = ['character', 'dialogue', 'parenthetical'];
    if (currentEl.type !== 'parenthetical' && text.startsWith('(') && prev && dialogueBlockTypes.includes(prev.el.type) && !prevEmpty) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'parenthetical' }));
      return;
    }

    triggerAutocomplete(id, text);
  };

  const handleBlur = (id) => {
    const text = blockTexts.current[id];
    const pendingType = pendingAutoTypes[id];
    if (text !== undefined || pendingType) {
      const updated = elements.map(el =>
        el.id === id ? { ...el, text: text !== undefined ? text : el.text, ...(pendingType ? { type: pendingType } : {}) } : el
      );
      saveScreenplay(updated);
    }
    setPendingAutoTypes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleKeyDown = (e, index, el) => {
    const text = blockTexts.current[el.id] !== undefined ? blockTexts.current[el.id] : el.text;
    if (autocomplete.show) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, index: (prev.index + 1) % prev.suggestions.length })); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, index: (prev.index - 1 + prev.suggestions.length) % prev.suggestions.length })); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyAutocomplete(autocomplete.suggestions[autocomplete.index]); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeAutocomplete(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      e.preventDefault();
      const typeMap = { '1': 'scene-heading', '2': 'action', '3': 'character', '4': 'parenthetical', '5': 'dialogue', '6': 'transition' };
      const nextType = typeMap[e.key];
      let formattedText = text;
      if (nextType === 'scene-heading' || nextType === 'character') formattedText = text.toUpperCase();
      blockTexts.current[el.id] = formattedText;
      ceInitSet.current.delete(el.id);
      const updated = elements.map(item => item.id === el.id ? { ...item, type: nextType, text: formattedText } : item);
      saveScreenplay(updated);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const caretOffset = preCaretRange.toString().length;
        const part1 = text.slice(0, caretOffset);
        const part2 = text.slice(caretOffset);
        let nextType = 'action';
        if (el.type === 'scene-heading') nextType = 'action';
        else if (el.type === 'character') nextType = 'dialogue';
        else if (el.type === 'parenthetical') nextType = 'dialogue';
        else if (el.type === 'dialogue') nextType = 'action';
        const newEl = { id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: nextType, text: part2 };
        const updated = [...elements];
        updated[index] = { ...el, text: part1 };
        updated.splice(index + 1, 0, newEl);
        blockTexts.current[el.id] = part1;
        ceInitSet.current.delete(el.id);
        saveScreenplay(updated);
        focusBlock(newEl.id, 'start');
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const types = ['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];
      const currentIndex = types.indexOf(el.type);
      const nextIndex = (currentIndex + (e.shiftKey ? -1 : 1) + types.length) % types.length;
      const nextType = types[nextIndex];
      let formattedText = text;
      if (nextType === 'scene-heading' || nextType === 'character') formattedText = text.toUpperCase();
      blockTexts.current[el.id] = formattedText;
      ceInitSet.current.delete(el.id);
      const updated = elements.map(item => item.id === el.id ? { ...item, type: nextType, text: formattedText } : item);
      saveScreenplay(updated);
      return;
    }
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const isAtStart = preCaretRange.toString().length === 0;
        if (isAtStart) {
          e.preventDefault();
          if (index > 0) {
            const previousEl = elements[index - 1];
            const prevId = previousEl.id;
            const prevLength = previousEl.text.length;
            const mergedText = previousEl.text + text;
            const updated = elements.filter(item => item.id !== el.id);
            updated[index - 1] = { ...previousEl, text: mergedText };
            ceInitSet.current.delete(prevId);
            saveScreenplay(updated);
            setTimeout(() => {
              const prevNode = elementRefs.current[prevId];
              if (prevNode) {
                prevNode.focus();
                const newRange = document.createRange();
                const sel = window.getSelection();
                if (prevNode.firstChild) {
                  const targetOffset = Math.min(prevLength, prevNode.firstChild.length || 0);
                  try { newRange.setStart(prevNode.firstChild, targetOffset); newRange.setEnd(prevNode.firstChild, targetOffset); } catch (_) { newRange.selectNodeContents(prevNode); newRange.collapse(false); }
                } else { newRange.selectNodeContents(prevNode); newRange.collapse(false); }
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            }, 30);
          }
          return;
        }
      }
    }
    if (e.key === 'ArrowUp') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const isAtStart = preCaretRange.toString().length === 0;
        if (isAtStart && index > 0) { e.preventDefault(); focusBlock(elements[index - 1].id, 'end'); }
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.target);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        const isAtEnd = postCaretRange.toString().trim() === '';
        if (isAtEnd && index < elements.length - 1) { e.preventDefault(); focusBlock(elements[index + 1].id, 'start'); }
      }
      return;
    }
  };

  const addLineAtEnd = (type) => {
    const newEl = { id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, text: type === 'scene-heading' ? 'INT. NOVO CENÁRIO - DIA' : '' };
    const updated = [...elements, newEl];
    saveScreenplay(updated);
    focusBlock(newEl.id, 'end');
  };

  const findMatchingCharacter = (nameText) => {
    if (!nameText || !currentProject || !currentProject?.entities?.characters) return null;
    const cleanText = nameText.trim().toUpperCase();
    return currentProject?.entities?.characters?.find(char => cleanText === char.name.toUpperCase() || char.name.toUpperCase().includes(cleanText));
  };

  const handleGripClick = (e, blockId, index) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveBlockMenu({ show: true, blockId, index, x: rect.left - 180, y: rect.bottom + window.scrollY });
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const moveBlockDown = (index) => {
    if (index === elements.length - 1) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const duplicateBlock = (index) => {
    const updated = [...elements];
    const block = updated[index];
    const duplicated = { ...block, id: `sc-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    updated.splice(index + 1, 0, duplicated);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const deleteBlock = (index) => {
    const updated = elements.filter((_, i) => i !== index);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const changeBlockType = (index, nextType) => {
    const updated = elements.map((item, i) => i === index ? { ...item, type: nextType } : item);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const handleAIAutoComplete = async (blockId) => {
    const key = getLLMApiKey();
    if (!key) { setConfirmModal({ title: 'API não configurada', message: 'Por favor, configure sua chave de API nas configurações do CineWeave para usar a IA.', variant: 'alert', confirmLabel: 'OK', onConfirm: () => setConfirmModal(null), onCancel: () => setConfirmModal(null) }); return; }
    setAiLoading(true); setAiError('');
    try {
      const currentIdx = elements.findIndex(el => el.id === blockId);
      const contextSlice = elements.slice(Math.max(0, currentIdx - 4), currentIdx + 1);
      const formattedContext = contextSlice.map(item => `${item.type.toUpperCase()}: ${item.text}`).join('\n');
      const systemPrompt = `Você é um co-roteirista profissional.\nEscreva a continuação do roteiro. Adicione exatamente 2 ou 3 novos elementos que continuem a história de forma orgânica.\nUse o contexto de personagens e locações do projeto para manter a coerência.\nPERSONAGENS CADASTRADOS: ${(currentProject?.entities?.characters || []).map(c => c.name).join(', ')}\nLOCAÇÕES CADASTRADAS: ${(currentProject?.entities?.locations || []).map(l => l.name).join(', ')}\n\nRetorne APENAS um array JSON válido contendo os novos elementos, no formato exato:\n[\n  { "type": "action" | "character" | "parenthetical" | "dialogue", "text": "..." }\n]\nNÃO retorne markdown, NÃO adicione blocos de código com \`\`\`, e NÃO insira textos introdutórios ou explicativos. Apenas o JSON puro.`;
      const userPrompt = `Abaixo está o final da cena escrita até agora. Escreva os próximos 2-3 blocos do roteiro de forma brilhante e cinematográfica:\n\n${formattedContext}`;
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 500, top_p: 0.95 })
      });
      if (!res.ok) throw new Error(`Falha no servidor de IA: código ${res.status}`);
      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      let cleanedJsonStr = aiResponse.trim();
      if (cleanedJsonStr.startsWith('```')) cleanedJsonStr = cleanedJsonStr.replace(/```(json)?/g, '').trim();
      const parsedNewElements = JSON.parse(cleanedJsonStr);
      if (Array.isArray(parsedNewElements)) {
        const enriched = parsedNewElements.map(item => ({ ...item, id: `sc-line-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
        const updated = [...elements];
        updated.splice(currentIdx + 1, 0, ...enriched);
        saveScreenplay(updated);
        focusBlock(enriched[0].id, 'start');
      }
    } catch (err) { console.error(err); setAiError('Ocorreu um erro ao gerar. Verifique seu formato ou tente novamente.'); }
    finally { setAiLoading(false); }
  };

  const handleAIImproveBlock = async (blockId) => {
    const key = getLLMApiKey();
    if (!key) { setConfirmModal({ title: 'API não configurada', message: 'Chave de API NVIDIA não configurada.', variant: 'alert', confirmLabel: 'OK', onConfirm: () => setConfirmModal(null), onCancel: () => setConfirmModal(null) }); return; }
    const block = elements.find(el => el.id === blockId);
    if (!block || !block.text.trim()) return;
    setAiLoading(true); setAiError('');
    try {
      const systemPrompt = `Você é um refinador de roteiros profissional de Hollywood.\nReescreva a linha fornecida para torná-la incrível, cinemática e com o tom: "${aiTone.toUpperCase()}".\nMantenha o tipo de elemento original (${block.type.toUpperCase()}).\nRetorne APENAS o texto reescrito final, sem aspas adicionais, sem markdown e sem qualquer explicação prévia.`;
      const userPrompt = `Reescreva esta fala/ação para o tom ${aiTone}:\n"${block.text}"`;
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.8, max_tokens: 300 })
      });
      if (!res.ok) throw new Error('AI Error code ' + res.status);
      const data = await res.json();
      const updatedText = (data.choices?.[0]?.message?.content || block.text).trim().replace(/^"|"$/g, '');
      const updated = elements.map(el => el.id === blockId ? { ...el, text: updatedText } : el);
      saveScreenplay(updated);
    } catch (err) { console.error(err); setAiError('Erro ao refinar bloco.'); }
    finally { setAiLoading(false); }
  };

  const [aiFeedback, setAiFeedback] = useState(null);
  const handleAIFeedback = async () => {
    const key = getLLMApiKey();
    if (!key) { setConfirmModal({ title: 'API não configurada', message: 'Configure sua chave de API NVIDIA primeiro.', variant: 'alert', confirmLabel: 'OK', onConfirm: () => setConfirmModal(null), onCancel: () => setConfirmModal(null) }); return; }
    setAiLoading(true); setAiError(''); setAiFeedback(null);
    try {
      const text = elements.filter(el => el.type !== 'beat-metadata').map(el => `${el.type.toUpperCase()}: ${el.text}`).join('\n');
      const systemPrompt = 'Você é um analista de roteiros profissional. Analise o roteiro abaixo e forneça feedback sobre: estrutura, ritmo, diálogo, personagens, formatação. Seja específico e construtivo. Responda em português.';
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.5, max_tokens: 800 })
      });
      if (!res.ok) throw new Error('AI Error code ' + res.status);
      const data = await res.json();
      setAiFeedback(data.choices?.[0]?.message?.content || 'Sem retorno.');
    } catch (err) { console.error(err); setAiError('Erro ao obter feedback.'); }
    finally { setAiLoading(false); }
  };

  /* ── Derive revision metadata for the panel ── */
  const revisionMeta = useMemo(() => {
    const meta = parseBeatMetadata(elements);
    return meta['BlockRevisions'] || {};
  }, [elements]);

  const revisionItems = useMemo(() => {
    if (!revisions || revisions.length === 0) return [];
    const items = [];
    let currentScene = { heading: 'Início', index: 0, sceneNumber: 0 };
    let sceneOrdinal = 0;
    elements.forEach((el, idx) => {
      const type = pendingAutoTypes[el.id] || el.type;
      if (type === 'scene-heading' || type === 'section') {
        sceneOrdinal += 1;
        currentScene = {
          heading: cleanSceneText(el.text) || (type === 'section' ? 'Seção' : 'Cena'),
          index: idx,
          sceneNumber: sceneOrdinal
        };
      }
      if (revisions.includes(el.id)) {
        items.push({
          id: el.id,
          text: cleanSceneText(el.text) || '[bloco vazio]',
          type,
          scene: currentScene,
          elIndex: idx,
          gen: typeof revisionMeta[el.id] === 'number' ? revisionMeta[el.id] : revisionGeneration
        });
      }
    });
    return items;
  }, [revisions, elements, pendingAutoTypes, revisionMeta, revisionGeneration]);

  const revisionGroups = useMemo(() => {
    const groups = [];
    let currentKey = null;
    revisionItems.forEach(item => {
      const key = `${item.scene.index}::${item.scene.heading}`;
      if (key !== currentKey) {
        groups.push({ scene: item.scene, items: [item] });
        currentKey = key;
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });
    return groups;
  }, [revisionItems]);

  const visibleRevisionCount = useMemo(() => {
    if (revisionFilter.mode === 'only') {
      return revisionGroups.reduce((sum, g) => sum + g.items.filter(i => !revisionFilter.hiddenGens.includes(i.gen)).length, 0);
    }
    return revisionItems.filter(i => !revisionFilter.hiddenGens.includes(i.gen)).length;
  }, [revisionItems, revisionGroups, revisionFilter]);

  /* ── Page estimator & scene list ── */
  const paginatedElements = useMemo(() => {
    let currentPage = 1;
    let score = 0;
    const items = [];
    const idIndexMap = {};
    elements.forEach((el, index) => { idIndexMap[el.id] = index; });
    elements.forEach((el, index) => {
      if (el.type === 'beat-metadata') return;
      const revIndex = Object.prototype.hasOwnProperty.call(revisionMeta, el.id) ? revisionMeta[el.id] : null;
      const isRevised = revisions.includes(el.id) && revIndex !== null && !revisionFilter.hiddenGens.includes(revisionMeta[el.id]);
      const isHiddenRevision = revisions.includes(el.id) && (revisionMeta[el.id] === undefined || revisionFilter.hiddenGens.includes(revisionMeta[el.id]));
      if (revisionFilter.mode === 'hide' && isHiddenRevision) return;
      if (revisionFilter.mode === 'only' && !isRevised && !el.type.match(/scene-heading|section|synopsis|note|beat/)) {
        const sceneBreak = el.type === 'scene-heading' || el.type === 'section';
        if (!sceneBreak) return;
      }
      let weight = 1;
      const textLength = el.text ? el.text.length : 0;
      if (el.type === 'scene-heading') weight = 4.5;
      else if (el.type === 'action') weight = Math.ceil(textLength / 65) + 1.2;
      else if (el.type === 'character') weight = 2.0;
      else if (el.type === 'parenthetical') weight = 1.2;
      else if (el.type === 'dialogue') weight = Math.ceil(textLength / 38) + 1.2;
      else if (el.type === 'transition') weight = 2.0;
      score += weight;
      if (score > 34 && index > 0) {
        items.push({ isPageBreak: true, pageNum: currentPage, nextPageNum: currentPage + 1 });
        currentPage++;
        score = weight;
      }
      items.push({ ...el, originalIndex: index, pageNum: currentPage });
    });
    return { items, totalPages: currentPage };
  }, [elements, revisions, revisionMeta, revisionFilter]);

  const pages = useMemo(() => {
    const map = {};
    paginatedElements.items.forEach(item => {
      if (item.isPageBreak) return;
      if (!map[item.pageNum]) map[item.pageNum] = [];
      map[item.pageNum].push(item);
    });
    return Object.entries(map).map(([num, items]) => ({
      pageNum: Number(num),
      elements: items.map(i => elements[i.originalIndex]).filter(Boolean)
    }));
  }, [paginatedElements, elements]);

  const sceneHeadingsList = useMemo(() => {
    const list = [];
    elements.forEach((el, index) => {
      if (el.type === 'scene-heading') {
        const text = el.text || '';
        const colorMatch = text.match(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/);
        const color = colorMatch ? colorMatch[1] : '#22252a';
        const cleanText = text.replace(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/g, '').replace(/#([^#]+)#/g, '').trim();
        const numMatch = text.match(/#([^#]+)#/);
        const sceneNum = numMatch ? numMatch[1] : (list.length + 1).toString();
        let sceneWords = 0;
        let j = index + 1;
        while (j < elements.length && elements[j].type !== 'scene-heading') {
          if (elements[j].text) sceneWords += elements[j].text.split(/\s+/).filter(Boolean).length;
          j++;
        }
        list.push({ id: el.id, text: el.text, cleanText, color, sceneNumber: sceneNum, words: sceneWords || 50, index });
      }
    });
    return list;
  }, [elements]);

  const sceneNumberMap = useMemo(() => {
    const map = {};
    sceneHeadingsList.forEach(scene => {
      map[scene.index] = scene.sceneNumber;
    });
    return map;
  }, [sceneHeadingsList]);

  const storylines = useMemo(() => {
    const map = {};
    elements.forEach((el) => {
      if (!el.text) return;
      const matches = [...el.text.matchAll(/\[\[beat\s+([^\]]+)\]\]/gi)];
      matches.forEach(m => {
        const beatVal = m[1];
        let category = 'Geral', detail = beatVal;
        if (beatVal.includes(':')) { const split = beatVal.split(':'); category = split[0].trim(); detail = split[1].trim(); }
        else if (beatVal.includes(',')) { const split = beatVal.split(','); category = split[0].trim(); detail = split[1].trim(); }
        if (!map[category]) map[category] = [];
        map[category].push({ text: el.text, detail, type: el.type });
      });
    });
    return map;
  }, [elements]);

  const stats = useMemo(() => {
    let wordCount = 0, actionCount = 0, dialogueCount = 0;
    let characterLines = {}, characterWords = {};
    let locationsMap = { INT: 0, EXT: 0, Est: 0 };
    let timeOfDayMap = { DIA: 0, NOITE: 0, TARDE: 0, OUTRO: 0 };
    let femaleSpeakers = new Set();
    elements.forEach((el, idx) => {
      if (!el.text || el.type === 'beat-metadata') return;
      const words = el.text.split(/\s+/).filter(Boolean).length;
      wordCount += words;
      if (el.type === 'action') actionCount++;
      if (el.type === 'dialogue') dialogueCount++;
      if (el.type === 'character') {
        const charName = el.text.trim().toUpperCase();
        characterLines[charName] = (characterLines[charName] || 0) + 1;
        let j = idx + 1, dialogueWordsSum = 0;
        while (j < elements.length && (elements[j].type === 'dialogue' || elements[j].type === 'parenthetical')) {
          if (elements[j].text) dialogueWordsSum += elements[j].text.split(/\s+/).filter(Boolean).length;
          j++;
        }
        characterWords[charName] = (characterWords[charName] || 0) + dialogueWordsSum;
        const matchingChar = (currentProject?.entities?.characters || []).find(c => c.name.toUpperCase() === charName);
        if (matchingChar && (matchingChar.notes?.toLowerCase().includes('feminino') || matchingChar.description?.toLowerCase().includes('gata'))) {
          femaleSpeakers.add(charName);
        }
      }
      if (el.type === 'scene-heading') {
        const upper = el.text.toUpperCase();
        if (upper.includes('INT.')) locationsMap.INT++;
        else if (upper.includes('EXT.')) locationsMap.EXT++;
        else locationsMap.Est++;
        if (upper.includes('DIA')) timeOfDayMap.DIA++;
        else if (upper.includes('NOITE')) timeOfDayMap.NOITE++;
        else if (upper.includes('TARDE')) timeOfDayMap.TARDE++;
        else timeOfDayMap.OUTRO++;
      }
    });
    const charactersStats = Object.keys(characterLines).map(name => ({ name, lines: characterLines[name], words: characterWords[name] || 0 })).sort((a, b) => b.lines - a.lines);
    return {
      wordCount, pagesCount: paginatedElements.totalPages, estimatedMinutes: paginatedElements.totalPages,
      actionCount, dialogueCount, locationsMap, timeOfDayMap, charactersStats,
      femaleSpeakersCount: femaleSpeakers.size, bechdelPassed: femaleSpeakers.size >= 2
    };
  }, [elements, currentProject, paginatedElements]);

  const moveCard = (sceneIndex, direction) => {
    if (direction === 'up' && sceneIndex === 0) return;
    if (direction === 'down' && sceneIndex === sceneHeadingsList.length - 1) return;
    const swapIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    const targetScene = sceneHeadingsList[sceneIndex];
    const swapScene = sceneHeadingsList[swapIndex];
    const getSceneBlock = (headingIndex) => {
      const idx = elements.findIndex(el => el.id === headingIndex.id);
      let end = elements.length;
      for (let j = idx + 1; j < elements.length; j++) {
        if (elements[j].type === 'scene-heading') { end = j; break; }
      }
      return { start: idx, end };
    };
    const firstBlock = getSceneBlock(Math.min(sceneIndex, swapIndex) === sceneIndex ? targetScene : swapScene);
    const secondBlock = getSceneBlock(Math.max(sceneIndex, swapIndex) === sceneIndex ? targetScene : swapScene);
    const updated = [...elements];
    const firstPart = updated.slice(0, firstBlock.start);
    const firstBlockData = updated.slice(firstBlock.start, firstBlock.end);
    const middlePart = updated.slice(firstBlock.end, secondBlock.start);
    const secondBlockData = updated.slice(secondBlock.start, secondBlock.end);
    const lastPart = updated.slice(secondBlock.end);
    saveScreenplay([...firstPart, ...secondBlockData, ...middlePart, ...firstBlockData, ...lastPart]);
  };

  const changeCardColor = (sceneIndex, colorCode) => {
    const scene = sceneHeadingsList[sceneIndex];
    const cleanText = scene.text.replace(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/g, '').trim();
    const updated = elements.map(el => el.id === scene.id ? { ...el, text: `${cleanText} [[${colorCode}]]` } : el);
    saveScreenplay(updated);
  };

  const updateCardSynopsis = (sceneIndex, newSynopsisText) => {
    const scene = sceneHeadingsList[sceneIndex];
    const idx = elements.findIndex(el => el.id === scene.id);
    if (idx >= 0) {
      let synopsisIdx = -1;
      if (idx + 1 < elements.length && elements[idx + 1].type === 'synopsis') synopsisIdx = idx + 1;
      const updated = [...elements];
      if (synopsisIdx >= 0) {
        updated[synopsisIdx] = { ...updated[synopsisIdx], text: newSynopsisText };
      } else {
        updated.splice(idx + 1, 0, { id: `sc-syn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, type: 'synopsis', text: newSynopsisText });
      }
      saveScreenplay(updated);
    }
  };

  /* ── Simulated Beat Plugins ── */
  const runPlugin = () => {
    setPluginRunning(true);
    setPluginLog([`[Beat Plugin Engine] Inicializando plugin: ${selectedPlugin.toUpperCase()}...`]);
    let currentLogs = [];
    const log = (msg) => { currentLogs.push(msg); setPluginLog([...currentLogs]); };
    setTimeout(() => {
      if (selectedPlugin === 'linter') {
        log('[Slugline Linter] Buscando cabeçalhos despadronizados...');
        const updated = elements.map(el => {
          if (el.type === 'scene-heading') { const formatted = el.text.toUpperCase(); log(`[Normalizado] -> ${formatted}`); return { ...el, text: formatted }; }
          return el;
        });
        saveScreenplay(updated);
        log('[Sucesso] Todos os cabeçalhos foram colocados em CAIXA ALTA!');
      } else if (selectedPlugin === 'bechdel') {
        log('[Diversity Analyzer] Rodando varredura por diversidade...');
        log(`[Análise] Personagens Femininos Identificados: ${stats.femaleSpeakersCount}`);
        if (stats.bechdelPassed) log('[PASSED] Seu roteiro atende aos critérios do Teste de Bechdel-Wallace!');
        else { log('[FALHA] Seu roteiro não atende aos critérios do Teste de Bechdel.'); log('  Dica: Garanta ao menos duas personagens femininas com nome próprio conversando.'); }
      } else if (selectedPlugin === 'cleaner') {
        log('[Markup Cleaner] Eliminando blocos de diálogo e ação vazios...');
        const updated = elements.filter(el => el.text && el.text.trim() !== '');
        saveScreenplay(updated);
        log('[Sucesso] Roteiro limpo de linhas e blocos vazios indesejados.');
      }
      setPluginRunning(false);
    }, 1500);
  };

  /* ── Compile Screenplay from Brainstorm ── */
  const handleCompileScreenplay = () => {
    setAiLoading(true); setAiError(''); setShowCompileModal(false);
    setTimeout(() => {
      try {
        const projEntities = currentProject?.entities || {};
        const plotPoints = projEntities.plot_points || [];
        const bdScenes = projEntities.scenes || [];
        const dialogues = projEntities.dialogues || [];
        const compiledElements = [];
        compiledElements.push(
          { id: `tp-1`, type: 'title-page', key: 'title', value: currentProject?.title || 'Sem título', text: `Title: ${currentProject?.title || 'Sem título'}` },
          { id: `tp-2`, type: 'title-page', key: 'credit', value: 'Written by', text: 'Credit: Written by' },
          { id: `tp-3`, type: 'title-page', key: 'author', value: 'CineWeave Creator', text: 'Author: CineWeave Creator' },
          { id: `tp-4`, type: 'title-page', key: 'draft date', value: new Date().toLocaleDateString('pt-BR'), text: `Draft date: ${new Date().toLocaleDateString('pt-BR')}` }
        );
        const acts = ['I', 'II', 'III', 'IV'];
        acts.forEach(actStr => {
          const actPlots = plotPoints.filter(p => (p.act || 'I').toUpperCase() === actStr);
          const actScenes = bdScenes.filter(s => (s.act || 'I').toUpperCase() === actStr);
          if (actPlots.length > 0 || actScenes.length > 0) {
            compiledElements.push({ id: `sc-act-${actStr}`, type: 'section', level: 1, text: `ATO ${actStr}` });
            actPlots.forEach((plot, pIdx) => { compiledElements.push({ id: `sc-syn-act-${actStr}-${pIdx}`, type: 'synopsis', text: plot.description || plot.title }); });
            actScenes.forEach((scene, sIdx) => {
              const colors = ['green', 'blue', 'pink', 'purple'];
              const randColor = colors[sIdx % colors.length];
              const titleText = (scene.title || '').toUpperCase().startsWith('INT.') || (scene.title || '').toUpperCase().startsWith('EXT.') ? scene.title.toUpperCase() : `EXT. ${scene.title.toUpperCase() || 'LOCAL'} - DIA`;
              compiledElements.push(
                { id: `sc-h-${scene.id}`, type: 'scene-heading', text: `${titleText} [[${randColor}]]` },
                { id: `sc-a-${scene.id}`, type: 'action', text: scene.description || 'Descreva as ações da cena aqui.' }
              );
              const relevantDialogues = dialogues.filter(d => d.context && d.context.toLowerCase().includes((scene.title || '').toLowerCase()));
              if (relevantDialogues.length > 0) {
                relevantDialogues.forEach((d, dIdx) => {
                  compiledElements.push({ id: `sc-c-${scene.id}-${dIdx}`, type: 'character', text: d.speaker.toUpperCase() });
                  compiledElements.push({ id: `sc-d-${scene.id}-${dIdx}`, type: 'dialogue', text: d.line });
                });
              } else {
                compiledElements.push({ id: `sc-c-def-${scene.id}`, type: 'character', text: 'PERSONAGEM' });
                compiledElements.push({ id: `sc-d-def-${scene.id}`, type: 'dialogue', text: 'Fale algo marcante aqui.' });
              }
            });
          }
        });
setActiveTab('editor');
        const linkedElements = compiledElements.map(el => {
          if (el.entityId) return el;
          if (el.type === 'scene-heading') {
            const elText = el.text.toUpperCase().trim();
            const cleanText2 = elText.replace(/^\d+\s+/, '').replace(/\s+\d+\s*$/, '').trim();
            const matchingScene = projEntities?.scenes?.find(s =>
              s.title.toUpperCase() === elText || s.title.toUpperCase() === cleanText2
            );
            if (matchingScene) return { ...el, entityId: matchingScene.id };
            const loc = projEntities?.locations?.find(l =>
              l.name.toUpperCase() === elText || `${l.type} ${l.name}`.toUpperCase() === elText
            );
            if (loc) return { ...el, entityId: loc.id };
          }
          if (el.type === 'character') {
            const charName = el.text.replace(/\(.*\)/, '').trim().toUpperCase();
            const matchingChar = projEntities?.characters?.find(c =>
              c.name.toUpperCase() === charName
            );
            if (matchingChar) return { ...el, entityId: matchingChar.id };
          }
          return el;
        });
        stageProposedChanges(linkedElements, 'compile', 'Compilação do Brainstorm');
        setConfirmModal({ title: 'Compilação Concluída', message: 'Compilação concluída! As mudanças estão pendentes para revisão. Vá na aba "Versões" para aprovar.', variant: 'alert', confirmLabel: 'Ir para Versões', onConfirm: () => { setConfirmModal(null); navigateTo('versions'); }, onCancel: () => setConfirmModal(null) });
      } catch (err) { console.error(err); setAiError('Falha ao compilar roteiro.'); }
      finally { setAiLoading(false); }
    }, 1200);
  };

  // outlinerFilteredScenes removed — using sceneHeadingsList directly via SharedSidebar

  const getTypeLabel = (type) => {
    switch (type) {
      case 'scene-heading': return 'CENA';
      case 'action': return 'AÇÃO';
      case 'character': return 'PERSONAGEM';
      case 'parenthetical': return 'PARÊNTESE';
      case 'dialogue': return 'DIÁLOGO';
      case 'transition': return 'TRANSIÇÃO';
      case 'section': return 'SEÇÃO';
      case 'synopsis': return 'SINOPSES';
      default: return 'AÇÃO';
    }
  };

  const getStyleForType = (type) => {
    switch (type) {
      case 'scene-heading': return 'script-scene-heading';
      case 'action': return 'script-action';
      case 'character': return 'script-character';
      case 'parenthetical': return 'script-parenthetical';
      case 'dialogue': return 'script-dialogue';
      case 'transition': return 'script-transition';
      case 'section': return 'script-section';
      case 'synopsis': return 'script-synopsis';
      default: return 'script-action';
    }
  };

  /* ── FichaModal handlers + Beat integration ── */
  const openFicha = (item, type, mode = 'view') => {
    setFichaModal({ item, type, mode });
  };
  const handleFichaSave = (data) => {
    const t = fichaModal.type;
    if (t === 'character') saveCharacter(data);
    else if (t === 'location') saveLocation(data);
    else if (t === 'object') saveObject(data);
    else saveEntity(t + 's', data);

    if (revisionMode && data.id && elements) {
      const linkedIds = elements.filter(el => el.entityId === data.id).map(el => el.id);
      if (linkedIds.length > 0) {
        setRevisions(prev => [...new Set([...prev, ...linkedIds])]);
      }
    }
    setFichaModal(null);
  };
  const handleFichaDelete = (id) => {
    const t = fichaModal.type;
    if (t === 'character') deleteCharacter(id);
    else if (t === 'location') deleteLocation(id);
    else if (t === 'object') deleteObject(id);
    else deleteEntityById(t + 's', id);
    setFichaModal(null);
  };

  const handleSidebarDelete = (item, type) => {
    if (!item?.id) return;
    if (type === 'character') deleteCharacter(item.id);
    else if (type === 'location') deleteLocation(item.id);
    else if (type === 'object') deleteObject(item.id);
    else deleteEntityById(type + 's', item.id);
  };

  /* ── Entity matching helpers for Ficha badges ── */
  const findMatchingScene = (text) => {
    if (!text || !currentProject?.entities?.scenes) return null;
    const clean = text.trim().toUpperCase();
    return currentProject?.entities?.scenes?.find(s => s.title.toUpperCase() === clean);
  };
  const findMatchingLocationFromHeading = (text) => {
    if (!text) return null;
    const clean = text.trim().toUpperCase();
    const all = [...(currentProject?.entities?.locations || [])];
    return all.find(l =>
      l.name.toUpperCase() === clean ||
      `${l.type || 'INT.'} ${l.name}`.toUpperCase() === clean
    );
  };

  if (!currentProject) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', flexDirection: 'column', gap: '12px', background: '#050505' }}>
        <div style={{ fontSize: '14px' }}>Nenhum projeto selecionado</div>
        <div style={{ fontSize: '12px', color: '#555' }}>Crie ou selecione um projeto para editar o roteiro</div>
      </div>
    );
  }

  return (
    <div className={`screenplay-layout-container ${zenMode ? 'zen-active' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: '#050505', color: '#fff' }}>
      {(() => {
        const pendingCount = getPendingStagingCount();
        if (pendingCount === 0) return null;
        return (
          <div
            onClick={() => navigateTo('versions')}
            style={{
              position: 'absolute',
              top: '50px',
              right: '20px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#f59e0b',
              fontSize: '11px',
              fontWeight: 'bold',
              boxShadow: '0 0 12px rgba(245,158,11,0.2)'
            }}
            title="Clique para revisar"
          >
            <AlertTriangle size={14} />
            <span>{pendingCount} atualização(ões) pendente(s)</span>
          </div>
        );
      })()}

      {/* ── Toolbar (full width, top) ── */}
      <div className="toolbar">
        <div className="toolbar-tabs">
            <button onClick={() => { setSidebarOpen(v => !v); setStylePanelOpen(v => !v); }} className={`toolbar-tab-btn ${stylePanelOpen || sidebarOpen ? 'active' : ''}`} title="Mostrar/Esconder Painéis">
              <Columns size={16} />
            </button>
            <button onClick={() => setStylePanelOpen(v => !v)} className={`toolbar-tab-btn ${stylePanelOpen ? 'active' : ''}`} title="Abrir/Fechar Revisão">
            <Settings2 size={14} />
          </button>
          <button onClick={() => setSidebarOpen(v => !v)} className={`toolbar-tab-btn ${sidebarOpen ? 'active' : ''}`} title="Abrir/Fechar Sidebar">
            <Columns size={14} />
          </button>
          <div className="toolbar-separator" />
          <button onClick={() => setActiveTab('editor')} className={`toolbar-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}><Edit3 size={14} /><span>Editor</span></button>
          <button onClick={() => setActiveTab('cards')} className={`toolbar-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}><Grid size={14} /><span>Fichas</span></button>
          <button onClick={() => setActiveTab('timeline')} className={`toolbar-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}><Layers size={14} /><span>Linha do Tempo</span></button>
          <button onClick={() => setActiveTab('stats')} className={`toolbar-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}><BarChart2 size={14} /><span>Estatisticas</span></button>
          <button onClick={() => setActiveTab('plugins')} className={`toolbar-tab-btn ${activeTab === 'plugins' ? 'active' : ''}`}><Cpu size={14} /><span>Plugins</span></button>
          {sceneHeadings.length > 0 && (
            <select
              value={activeSceneIdx >= 0 ? activeSceneIdx : ''}
              onChange={(e) => { const idx = parseInt(e.target.value); if (idx >= 0) focusBlock(sceneHeadings[idx].id, 'start'); }}
              className="toolbar-tab-btn"
              style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ccc', cursor: 'pointer', maxWidth: '140px' }}
              title="Ir para Cena"
            >
              {sceneHeadings.map((sh, i) => (
                <option key={sh.id} value={i}>
                  #{i + 1} {sh.text?.slice(0, 40)}
                </option>
              ))}
            </select>
          )}
          <div className="toolbar-separator" />
          <button onClick={() => { setPageViewMode('continuous'); setCurrentPage(1); }} className={`toolbar-tab-btn ${pageViewMode === 'continuous' ? 'active' : ''}`} title="Pagina continua">
            <FileText size={14} /><span>Continuo</span>
          </button>
          <button onClick={() => { setPageViewMode('paginated'); setCurrentPage(1); }} className={`toolbar-tab-btn ${pageViewMode === 'paginated' ? 'active' : ''}`} title="Pagina por pagina">
            <Layers size={14} /><span>Paginas</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchMatchIdx(0); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) performSearch(-1); else performSearch(1); } if (e.key === 'Escape') setSearchQuery(''); }}
              placeholder="🔍 Buscar..."
              className="toolbar-search"
            />
            {searchQuery && (
              <span style={{ position: 'absolute', right: 4, fontSize: '10px', color: '#888', pointerEvents: 'none' }}>
                {searchMatches.length > 0 ? `${searchMatchIdx + 1}/${searchMatches.length}` : '0'}
              </span>
            )}
          </div>
          <button onClick={() => setVersionPanelOpen(v => !v)} className={`toolbar-tab-btn ${versionPanelOpen ? 'active' : ''}`} title="Painel de Versões"><Clock size={14} /></button>
          <button onClick={() => setCoverageModal(true)} className="toolbar-tab-btn" title="Análise de Roteiro"><BarChart2 size={14} /></button>
          <button onClick={() => setClassicScriptsModal(true)} className="toolbar-tab-btn" title="Importar Roteiros Clássicos"><BookOpen size={14} /></button>
          <input ref={fountainInputRef} type="file" accept=".fountain,.txt,.pdf" onChange={handleFountainImport} style={{ display: 'none' }} />
          <button onClick={() => fountainInputRef.current.click()} className="toolbar-tab-btn" title="Importar .fountain / .pdf"><Upload size={14} /></button>
          <button onClick={handleFountainExport} className="toolbar-tab-btn" title="Exportar .fountain"><Download size={14} /></button>
          <button onClick={handlePDFExport} className="toolbar-tab-btn" title="Exportar PDF"><Printer size={14} /></button>
          <button onClick={handleAIFeedback} disabled={aiLoading} className="toolbar-tab-btn" title="Feedback da IA"><Award size={14} /></button>
          <button onClick={() => setShowCompileModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', padding: '6px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}><Sparkles size={12} /></button>
          <button onClick={() => setTypewriterMode(!typewriterMode)} className={`toolbar-tab-btn ${typewriterMode ? 'active' : ''}`} title="Modo Typewriter"><Edit3 size={14} /></button>
          <button onClick={() => setZenMode(!zenMode)} className={`toolbar-tab-btn ${zenMode ? 'active' : ''}`} title="Modo Zen"><Minimize2 size={14} /></button>
        </div>
      </div>

      {/* ── Main area (panels + editor) ── */}
      <div className="main-area" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Revision Panel ── */}
        {stylePanelOpen && (
          <div className="style-panel-wrapper open">
            <StylePanel
              open={true}
              onCollapse={() => setStylePanelOpen(false)}
              revisionFilter={revisionFilter}
              setRevisionFilter={setRevisionFilter}
              revisionMode={revisionMode}
              setRevisionMode={setRevisionMode}
              revisionGeneration={revisionGeneration}
              setRevisionGeneration={setRevisionGeneration}
              revisionCount={revisionItems.length}
              revisionGroups={revisionGroups}
              visibleCount={visibleRevisionCount}
              revisions={revisions}
              focusBlock={focusBlock}
              toggleRevision={(id) => {
                setRevisions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              }}
              clearAllRevisions={() => setRevisions([])}
            />
          </div>
        )}

        {/* ── Editor Container ── */}
        <div className={`editor-container ${activeTab === 'editor' && !printMode && pageViewMode === 'continuous' ? 'continuous-active' : ''} ${printMode ? 'print-active' : ''} ${typewriterMode ? 'typewriter-active' : ''}`} style={{ flex: 1, overflow: 'auto' }}>
          
          {/* ── Print Mode Toggle (canto superior direito) ── */}
          {activeTab === 'editor' && (
            <button
              onClick={() => setPrintMode(v => !v)}
              className={`toolbar-tab-btn ${printMode ? 'active' : ''}`}
              title={printMode ? 'Desativar Modo Impressão' : 'Ativar Modo Impressão'}
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, padding: '6px' }}
            >
              <Printer size={14} />
            </button>
          )}
          
          {/* ── A. TEXT EDITOR ── */}
          {activeTab === 'editor' && (
            pageViewMode === 'continuous' ? (
              <div className={`screenplay-container continuous-mode dark-paper ${printMode ? 'print-mode' : ''}`} style={{ width: '100%' }}>
                {/* Minimap — scene navigation strip */}
                {sceneHeadings.length > 1 && (
                  <div className="minimap">
                    {sceneHeadings.map((sh, i) => (
                      <div
                        key={sh.id}
                        onClick={() => focusBlock(sh.id, 'start')}
                        title={sh.text}
                        className={`minimap-dot ${i === activeSceneIdx ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                )}
                {elements.filter(el => el.type !== 'beat-metadata').length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#7c7c82' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '16px' }}>Seu roteiro esta em branco. Escreva um cabecalho de cena para comecar.</p>
                    <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ Comecar Roteiro</button>
                  </div>
                ) : (
                  paginatedElements.items.map((item) => {
                    if (item.isPageBreak) {
                      return (
                        <div key={`break-${item.pageNum}`} className="virtual-page-break">
                          <span className="virtual-page-number">{item.pageNum}</span>
                        </div>
                      );
                    }
                    const el = elements[item.originalIndex];
                    if (!el) return null;
                    if (el.type === 'beat-metadata') return null;
                    if (el.type === 'title-page') {
                      return <div key={el.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0', fontSize: '11px', color: '#7c7c82', display: 'flex', gap: '8px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#ccee00' }}>[FOLHA DE ROSTO]</span>
                        <span>{el.text}</span>
                      </div>;
                    }
                    const isRevised = revisions.includes(el.id);
                    const gen = REVISION_GENERATIONS.find(g => g.level === revisionGeneration) || REVISION_GENERATIONS[0];
                    const cleanText = cleanSceneText(el.text);
                    const isSceneHeading = (pendingAutoTypes[el.id] || el.type) === 'scene-heading';
                    const isSearchMatch = searchQuery && searchMatches.includes(el.id);
                    return (
                      <div key={el.id} className={`script-element-wrapper ${isSearchMatch ? 'search-match' : ''} ${isSearchMatch && searchMatches[searchMatchIdx] === el.id ? 'search-match-current' : ''}`}>
                        <span className="format-badge">{getTypeLabel(pendingAutoTypes[el.id] || el.type)}</span>
                        {isSceneHeading && (
                          <span className="scene-marker">#{sceneNumberMap[item.originalIndex] || item.originalIndex + 1}</span>
                        )}
                        {isRevised && (
                          <>
                            <span className="revision-star" style={{ color: gen.hex }}>{gen.marker}</span>
                            <div className="revision-star-bar" style={{ backgroundColor: gen.hex }} />
                          </>
                        )}
                        <div
                          ref={ref => {
                            if (ref) {
                              elementRefs.current[el.id] = ref;
                              if (!ceInitSet.current.has(el.id) || !ref.innerText.trim()) {
                                ref.innerText = cleanText;
                                ceInitSet.current.add(el.id);
                              }
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          className={`script-element ${getStyleForType(pendingAutoTypes[el.id] || el.type)}`}
                          onInput={(e) => handleInput(el.id, e.target.innerText)}
                          onBlur={() => handleBlur(el.id)}
                          onKeyDown={(e) => handleKeyDown(e, item.originalIndex, el)}
                          style={{ minHeight: '1.5em' }}
                        />
                        <div className="script-element-actions-trigger">
                          <button onClick={() => handleAIAutoComplete(el.id)} style={{ padding: '4px', borderRadius: '4px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', cursor: 'pointer' }} title="Completar Cena com IA"><Sparkles size={11} /></button>
                          <select value={aiTone} onChange={(e) => { setAiTone(e.target.value); setTimeout(() => handleAIImproveBlock(el.id), 50); }} style={{ background: '#020203', border: '1px solid #1d1d24', color: '#fff', fontSize: '9px', borderRadius: '4px', padding: '2px' }} title="Reescrever Linha com IA">
                            <option value="dramatico">Drama</option>
                            <option value="misterioso">Misterio</option>
                            <option value="comico">Comico</option>
                            <option value="acao">Acao</option>
                          </select>
                        </div>
                        <div onClick={(e) => handleGripClick(e, el.id, item.originalIndex)} style={{ position: 'absolute', left: '-24px', top: '8px', cursor: 'pointer', color: '#444', fontSize: '12px', userSelect: 'none' }} title="Acoes do Bloco">⠿</div>
                        {(pendingAutoTypes[el.id] || el.type) === 'character' && findMatchingCharacter(el.text) && (
                          <span onClick={() => openFicha(findMatchingCharacter(el.text), 'character')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(204,238,0,0.12)', color: '#ccee00', border: '1px solid rgba(204,238,0,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Ficha
                          </span>
                        )}
                        {isSceneHeading && findMatchingScene(cleanText) && (
                          <span onClick={() => openFicha(findMatchingScene(cleanText), 'scene')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cena
                          </span>
                        )}
                        {isSceneHeading && !findMatchingScene(cleanText) && findMatchingLocationFromHeading(el.text) && (
                          <span onClick={() => openFicha(findMatchingLocationFromHeading(el.text), 'location')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Loc
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {paginatedElements.totalPages > 0 && (
                  <div className="virtual-page-break final-page">
                    <span className="virtual-page-number">{paginatedElements.totalPages}</span>
                  </div>
                )}
                <div style={{ position: 'fixed', bottom: '24px', background: 'rgba(8,8,10,0.95)', border: '1px solid #141419', borderRadius: '30px', padding: '6px 16px', display: 'flex', gap: '8px', zIndex: 'var(--z-tooltip)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Cena</button>
                  <button onClick={() => addLineAtEnd('action')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Acao</button>
                  <button onClick={() => addLineAtEnd('character')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Persona</button>
                  <button onClick={() => addLineAtEnd('dialogue')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Dialogo</button>
                  <button onClick={() => addLineAtEnd('parenthetical')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>() Parentese</button>
                  <button onClick={() => addLineAtEnd('transition')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Transicao</button>
                </div>
              </div>
            ) : (
              <div className="paginated-viewport">
                {pages.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#7c7c82' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '16px' }}>Roteiro vazio. Escreva algo para ver as paginas.</p>
                  </div>
                ) : (
                  <>
                    <div className="page-sheet-wrapper">
                      <div className={`screenplay-container page-sheet dark-paper ${printMode ? 'print-mode' : ''}`}>
                        {pages[currentPage - 1]?.elements.map((el) => {
                          if (el.type === 'beat-metadata') return null;
                          if (el.type === 'title-page') {
                            return <div key={el.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0', fontSize: '11px', color: '#7c7c82', display: 'flex', gap: '8px', fontFamily: 'monospace' }}>
                              <span style={{ color: '#ccee00' }}>[FOLHA DE ROSTO]</span>
                              <span>{el.text}</span>
                            </div>;
                          }
                          const isRevised = revisions.includes(el.id);
                          const gen = REVISION_GENERATIONS.find(g => g.level === revisionGeneration) || REVISION_GENERATIONS[0];
                          const origIndex = elements.indexOf(el);
                          const cleanText = cleanSceneText(el.text);
                          const isSceneHeading = (pendingAutoTypes[el.id] || el.type) === 'scene-heading';
                          const isSearchMatch = searchQuery && searchMatches.includes(el.id);
                          return (
                            <div key={el.id} className={`script-element-wrapper ${isSearchMatch ? 'search-match' : ''} ${isSearchMatch && searchMatches[searchMatchIdx] === el.id ? 'search-match-current' : ''}`}>
                              <span className="format-badge">{getTypeLabel(pendingAutoTypes[el.id] || el.type)}</span>
                              {isSceneHeading && (
                                <span className="scene-marker">#{sceneNumberMap[origIndex] || origIndex + 1}</span>
                              )}
                              {isRevised && (
                                <>
                                  <span className="revision-star" style={{ color: gen.hex }}>{gen.marker}</span>
                                  <div className="revision-star-bar" style={{ backgroundColor: gen.hex }} />
                                </>
                              )}
                              <div
                                ref={ref => {
                                  if (ref) {
                                    elementRefs.current[el.id] = ref;
                                    if (!ceInitSet.current.has(el.id) || !ref.innerText.trim()) {
                                      ref.innerText = cleanText;
                                      ceInitSet.current.add(el.id);
                                    }
                                  }
                                }}
                                contentEditable
                                suppressContentEditableWarning
                                className={`script-element ${getStyleForType(pendingAutoTypes[el.id] || el.type)}`}
                                onInput={(e) => handleInput(el.id, e.target.innerText)}
                                onBlur={() => handleBlur(el.id)}
                                onKeyDown={(e) => handleKeyDown(e, origIndex, el)}
                                style={{ minHeight: '1.5em' }}
                              />
                              <div className="script-element-actions-trigger">
                                <button onClick={() => handleAIAutoComplete(el.id)} style={{ padding: '4px', borderRadius: '4px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', cursor: 'pointer' }} title="Completar Cena com IA"><Sparkles size={11} /></button>
                                <select value={aiTone} onChange={(e) => { setAiTone(e.target.value); setTimeout(() => handleAIImproveBlock(el.id), 50); }} style={{ background: '#020203', border: '1px solid #1d1d24', color: '#fff', fontSize: '9px', borderRadius: '4px', padding: '2px' }} title="Reescrever Linha com IA">
                                  <option value="dramatico">Drama</option>
                                  <option value="misterioso">Misterio</option>
                                  <option value="comico">Comico</option>
                                  <option value="acao">Acao</option>
                                </select>
                              </div>
                              <div onClick={(e) => handleGripClick(e, el.id, origIndex)} style={{ position: 'absolute', left: '-24px', top: '8px', cursor: 'pointer', color: '#444', fontSize: '12px', userSelect: 'none' }} title="Acoes do Bloco">⠿</div>
                              {(pendingAutoTypes[el.id] || el.type) === 'character' && findMatchingCharacter(el.text) && (
                                <span onClick={() => openFicha(findMatchingCharacter(el.text), 'character')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(204,238,0,0.12)', color: '#ccee00', border: '1px solid rgba(204,238,0,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>Ficha</span>
                              )}
                              {isSceneHeading && findMatchingScene(cleanText) && (
                                <span onClick={() => openFicha(findMatchingScene(cleanText), 'scene')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>Cena</span>
                              )}
                              {isSceneHeading && !findMatchingScene(cleanText) && findMatchingLocationFromHeading(el.text) && (
                                <span onClick={() => openFicha(findMatchingLocationFromHeading(el.text), 'location')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>Loc</span>
                              )}
                            </div>
                          );
                        })}
                        <div className="page-footer-number">{currentPage}</div>
                      </div>
                    </div>
                    <div className="page-nav-bar">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="page-nav-btn"><ChevronLeft size={14} /> Anterior</button>
                      <span className="page-nav-indicator">{currentPage} / {paginatedElements.totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(paginatedElements.totalPages, p + 1))} disabled={currentPage >= paginatedElements.totalPages} className="page-nav-btn">Proxima <ChevronRight size={14} /></button>
                    </div>
                    <div style={{ position: 'fixed', bottom: '24px', background: 'rgba(8,8,10,0.95)', border: '1px solid #141419', borderRadius: '30px', padding: '6px 16px', display: 'flex', gap: '8px', zIndex: 'var(--z-tooltip)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                      <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Cena</button>
                      <button onClick={() => addLineAtEnd('action')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Acao</button>
                      <button onClick={() => addLineAtEnd('character')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Persona</button>
                      <button onClick={() => addLineAtEnd('dialogue')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Dialogo</button>
                      <button onClick={() => addLineAtEnd('parenthetical')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>() Parentese</button>
                      <button onClick={() => addLineAtEnd('transition')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Transicao</button>
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* ── ESTILO & REVISAO floating panel ── */}
          {activeTab === 'editor' && (
            <StylePanel
              open={stylePanelOpen}
              onCollapse={() => setStylePanelOpen(false)}
              revisionFilter={revisionFilter}
              setRevisionFilter={setRevisionFilter}
              revisionMode={revisionMode}
              setRevisionMode={setRevisionMode}
              revisionGeneration={revisionGeneration}
              setRevisionGeneration={setRevisionGeneration}
              revisionCount={revisionItems.length}
              revisionGroups={revisionGroups}
              visibleCount={visibleRevisionCount}
              revisions={revisions}
              focusBlock={focusBlock}
              toggleRevision={(id) => {
                setRevisions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              }}
              clearAllRevisions={() => setRevisions([])}
              printMode={printMode}
              setPrintMode={setPrintMode}
            />
          )}

          {aiFeedback && (
            <div style={{ maxWidth: '816px', margin: '20px auto', background: 'rgba(10,10,14,0.8)', border: '1px solid rgba(204,238,0,0.15)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccee00', margin: 0 }}>Feedback da IA</h3>
                <button onClick={() => setAiFeedback(null)} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>Fechar</button>
              </div>
              <div style={{ fontSize: '12px', color: '#c8c8d0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {aiFeedback}
              </div>
            </div>
          )}

          {/* ── B. CORKBOARD ── */}
          {activeTab === 'cards' && (
            <div className="corkboard">
              {sceneHeadingsList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#7c7c82' }}>
                  <HelpCircle size={48} style={{ margin: '0 auto 16px auto', color: '#444' }} />
                  <p>Nenhuma cena identificada no roteiro. Comece criando um cabecalho de cena!</p>
                </div>
              ) : (
                sceneHeadingsList.map((scene, sceneIdx) => (
                  <div key={scene.id} className="index-card">
                    <div className="index-card-header" style={{ borderTop: `4px solid ${scene.color}` }}>
                      <span style={{ color: '#ccee00' }}>#{scene.sceneNumber}</span>
                      <h3 className="index-card-title">{scene.cleanText}</h3>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => moveCard(sceneIdx, 'up')} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                        <button onClick={() => moveCard(sceneIdx, 'down')} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                      </div>
                    </div>
                    <div className="index-card-body">
                      <textarea
                        className="index-card-synopsis-textarea"
                        value={elements[elements.findIndex(el => el.id === scene.id) + 1]?.type === 'synopsis' ? elements[elements.findIndex(el => el.id === scene.id) + 1].text : ''}
                        onChange={e => updateCardSynopsis(sceneIdx, e.target.value)}
                        placeholder="Adicione uma sinopse descritiva para esta cena..."
                      />
                    </div>
                    <div className="index-card-footer">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['#10b981', '#3b82f6', '#ec4899', '#ef4444', '#f59e0b', '#22252a'].map(c => (
                          <div key={c} onClick={() => changeCardColor(sceneIdx, c)} className="color-dot" style={{ backgroundColor: c, border: scene.color === c ? '2px solid #fff' : 'none' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── C. TIMELINE ── */}
          {activeTab === 'timeline' && (
            <div className="timeline-container">
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Mural de Cenas por Comprimento (Tempo de Tela)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Cada bloco representa uma cena. A largura representa o tempo de tela proporcional de acordo com a quantidade de blocos.</p>
                <div className="timeline-track">
                  {sceneHeadingsList.map((scene) => (
                    <div key={scene.id} onClick={() => focusBlock(scene.id, 'start')} className="timeline-block" style={{ width: `${Math.max(80, scene.words * 1.5)}px`, backgroundColor: scene.color, borderLeft: '4px solid #ccee00' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff' }}>#{scene.sceneNumber}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scene.cleanText}</span>
                      <span style={{ fontSize: '9px', color: '#eaeae3', alignSelf: 'flex-end' }}>{scene.words} pal</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Rastreador de Subtramas (Storylines / Beats)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Mapeia subtramas anotadas com o marcador Beat ex: <code>{"[[beat Agnes:Mother finds diary]]"}</code>.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.keys(storylines).length === 0 ? (
                    <p style={{ fontSize: '11px', color: '#7c7c82', fontStyle: 'italic' }}>Nenhuma subtrama beat identificada. Adicione marcas no texto como <code>{"[[beat Fumaca, treinamento]]"}</code>!</p>
                  ) : (
                    Object.keys(storylines).map(cat => (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: '#08080a', border: '1px solid #141419', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccee00' }}>SUBTRAMA: {cat.toUpperCase()}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {storylines[cat].map((beat, bIdx) => (
                            <div key={bIdx} style={{ background: '#121217', padding: '6px 12px', borderRadius: '4px', border: '1px solid #22252a', fontSize: '10px' }}>
                              <span style={{ color: '#ec4899', fontWeight: 'bold' }}>• {beat.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── D. STATS ── */}
          {activeTab === 'stats' && (
            <div style={{ flex: 1, width: '100%', overflowY: 'auto', background: '#050506' }}>
              <div className="stats-grid">
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>PAGINAS ESTIMADAS</span><div className="stats-number">{stats.pagesCount}</div></div>
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TOTAL DE PALAVRAS</span><div className="stats-number">{stats.wordCount}</div></div>
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TEMPO DE TELA ESTIMADO</span><div className="stats-number">{stats.estimatedMinutes} min</div></div>
                <div className="stats-card">
                  <span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TESTE BECHDEL-WALLACE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {stats.bechdelPassed ? <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={16} /> Aprovado!</span> : <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={16} /> Falhou</span>}
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Distribuicao de Linhas de Dialogo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.charactersStats.map(c => {
                      const totalLines = stats.charactersStats.reduce((sum, item) => sum + item.lines, 0);
                      const pct = Math.round((c.lines / (totalLines || 1)) * 100);
                      return (
                        <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                            <span style={{ color: '#7c7c82' }}>{c.lines} falas ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#1c1c24', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#ccee00', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Metricas Ambientais</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7c7c82', display: 'block', marginBottom: '6px' }}>AMBIENTE (INT. vs EXT.)</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <div style={{ flex: 1, background: '#121217', padding: '8px', borderRadius: '6px', textAlign: 'center' }}><span style={{ display: 'block', fontWeight: 'bold', color: '#ccee00' }}>{stats.locationsMap.INT}</span><span style={{ fontSize: '9px', color: '#7c7c82' }}>INTERIORES</span></div>
                        <div style={{ flex: 1, background: '#121217', padding: '8px', borderRadius: '6px', textAlign: 'center' }}><span style={{ display: 'block', fontWeight: 'bold', color: '#ccee00' }}>{stats.locationsMap.EXT}</span><span style={{ fontSize: '9px', color: '#7c7c82' }}>EXTERIORES</span></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7c7c82', display: 'block', marginBottom: '6px' }}>PERIODOS DO DIA</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                        {Object.entries(stats.timeOfDayMap).map(([period, val]) => (
                          <div key={period} style={{ flex: 1, background: '#121217', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#fff' }}>{val}</span><span style={{ display: 'block', fontSize: '8px', color: '#7c7c82' }}>{period}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── E. PLUGINS ── */}
          {activeTab === 'plugins' && (
            <div style={{ flex: 1, padding: '32px', background: '#050506', overflowY: 'auto', width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Plugin Store (Extensoes Beat)</h3>
                  <p style={{ fontSize: '12px', color: '#7c7c82' }}>Execute scripts rapidos para higienizar e analisar sua base de roteiro.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div onClick={() => setSelectedPlugin('linter')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'linter' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'linter' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>1. Slugline Headings Linter</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Converte automaticamente todos os cabecalhos de cena para CAIXA ALTA.</p>
                    </div>
                    <div onClick={() => setSelectedPlugin('bechdel')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'bechdel' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'bechdel' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>2. Diversity & Bechdel Test Script</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Mapeia genero de personagens e verifica dialogos cruzados.</p>
                    </div>
                    <div onClick={() => setSelectedPlugin('cleaner')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'cleaner' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'cleaner' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>3. Empty Blocks Cleaner</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Elimina blocos ou paragrafos de roteiro que ficaram em branco ou vazios.</p>
                    </div>
                  </div>
                  <button onClick={runPlugin} disabled={pluginRunning} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}>{pluginRunning ? 'Executando script...' : 'Executar Plugin Ativo'}</button>
                </div>
                <div style={{ background: '#020203', border: '1px solid #1c1c22', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column', height: '360px' }}>
                  <span style={{ color: '#7c7c82', borderBottom: '1px solid #141419', paddingBottom: '8px', display: 'block', marginBottom: '12px' }}>TERMINAL OUTPUT LOG</span>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pluginLog.length === 0 ? <span style={{ color: '#444' }}>Aguardando execucao de plugin...</span> : pluginLog.map((log, idx) => <span key={idx} style={{ color: log.includes('[Sucesso]') || log.includes('[PASSED]') ? '#10b981' : log.includes('[FALHA]') ? '#ef4444' : '#eaeaea' }}>{log}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── F. ESTILO & REVISOES moved into floating editor panel */}

        </div>
      </div>

      <SharedSidebar
        currentProject={currentProject}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        onEdit={(item, type, mode) => {
          if (!item) {
            switch (type) {
              case 'character': openFicha({ name: '', role: 'Coadjuvante', description: '', traits: [], backstory: '', notes: '' }, 'character', 'edit'); break;
              case 'location': openFicha({ name: '', type: 'EXT.', description: '', timeOfDay: 'DIA', mood: '' }, 'location', 'edit'); break;
              case 'object': openFicha({ name: '', description: '', significance: '' }, 'object', 'edit'); break;
              case 'scene': openFicha({ title: 'Nova Cena', synopsis: '', actId: '', order: 0, status: 'rascunho', characterIds: [], locationId: '', timeOfDay: '' }, 'scene', 'edit'); break;
              case 'plot_point': openFicha({ name: 'Novo Plot Point', description: '', impact: '', storyArc: '' }, 'plot_point', 'edit'); break;
              case 'theme': openFicha({ name: 'Novo Tema', statement: '', description: '', tags: [] }, 'theme', 'edit'); break;
              case 'act': openFicha({ name: 'Novo Ato', description: '', color: '#ccee00', order: 0 }, 'act', 'edit'); break;
              default: openFicha({ name: '' }, type, 'edit');
            }
          } else {
            openFicha(item, type, mode || 'edit');
          }
        }}
        onDelete={handleSidebarDelete}
        onSelectItem={(item, type) => openFicha(item, type)}
        tabContext="screenplay"
        open={sidebarOpen && !zenMode}
        onToggle={() => { if (zenMode) setZenMode(false); setSidebarOpen(prev => !prev); }}
        outlinerData={sceneHeadingsList}
        onOutlinerSelect={(item) => focusBlock(item.id, 'start')}
        position={sidebarPosition}
        onPositionToggle={() => setSidebarPosition(prev => prev === 'right' ? 'left' : 'right')}
      />

      {/* ── Autocomplete ── */}
      {autocomplete.show && (
        <div ref={autocompleteRef} className="screenplay-autocomplete" style={{ left: `${autocomplete.x}px`, top: `${autocomplete.y}px` }}>
          <div className="p-1 border-b border-white/5 mb-1 flex justify-between items-center">
            <span className="text-[8px] uppercase tracking-wider text-yellow-500 font-bold">Sugestoes de Roteiro</span>
            <span className="text-[7px] text-gray-500 font-mono">[Tab] Autocompletar</span>
          </div>
          {autocomplete.suggestions.map((val, idx) => (
            <div key={val} onClick={() => applyAutocomplete(val)} className={`screenplay-autocomplete-item ${idx === autocomplete.index ? 'selected' : ''}`}>
              <span>{val}</span>
              <span className="screenplay-autocomplete-badge">{autocomplete.type === 'character' ? 'Personagem' : 'Locacao'}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Block Menu ── */}
      {activeBlockMenu.show && (
        <div className="block-menu-dropdown" style={{ position: 'absolute', left: `${activeBlockMenu.x}px`, top: `${activeBlockMenu.y}px`, background: '#0a0a0d', border: '1px solid #1d1d24', borderRadius: '6px', padding: '4px', zIndex: 'var(--z-tooltip)', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', width: '180px' }} onClick={(e) => e.stopPropagation()}>
          <div onClick={() => moveBlockUp(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Mover para Cima</span></div>
          <div onClick={() => moveBlockDown(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Mover para Baixo</span></div>
          <div onClick={() => duplicateBlock(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Duplicar Bloco</span></div>
          <div onClick={() => deleteBlock(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Excluir Bloco</span></div>
          <div style={{ borderBottom: '1px solid #141419', margin: '4px 0' }} />
          <div style={{ padding: '2px 12px', fontSize: '8px', color: '#7c7c82', fontWeight: 'bold' }}>CONVERTER PARA...</div>
          {['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'].map(t => (
            <div key={t} onClick={() => changeBlockType(activeBlockMenu.index, t)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', textTransform: 'capitalize' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{getTypeLabel(t)}</div>
          ))}
        </div>
      )}

      {/* ── Compile Modal ── */}
      {showCompileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }}>
          <div style={{ width: '480px', padding: '24px', background: '#0a0a0d', border: '1px solid #1d1d24', borderRadius: '12px', textAlign: 'center' }}>
            <Sparkles size={48} style={{ color: '#ccee00', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Compilar Assistente de Roteiro</h3>
            <p style={{ fontSize: '12px', color: '#7c7c82', lineHeight: '18px', marginBottom: '24px' }}>
              Isso reunira os nos do Mapa Mental, ideias gravadas e os dados de Brainstorm estruturado para criar um rascunho completo do roteiro em blocos estilizados.
            </p>
            {aiLoading ? (
              <div style={{ padding: '12px', color: '#ccee00', fontSize: '13px', fontWeight: 'bold' }}>Compilando roteiro estruturado...</div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="button" onClick={() => setShowCompileModal(false)} style={{ background: '#121217', border: '1px solid #1d1d24', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                <button type="button" onClick={handleCompileScreenplay} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Iniciar Compilacao</button>
              </div>
            )}
            {aiError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '10px' }}>{aiError}</p>}
          </div>
        </div>
      )}

      {/* ── FichaModal (unificado) ── */}
      {fichaModal && (
        <FichaModal
          item={fichaModal.item}
          type={fichaModal.type}
          mode={fichaModal.mode}
          acts={currentProject?.entities?.acts || []}
          onSave={handleFichaSave}
          onDelete={handleFichaDelete}
          onClose={() => setFichaModal(null)}
          onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
          onNavigateToMindMap={(id) => navigateTo('mindmap', id)}
          onNavigateToScreenplay={(id) => {
            setActiveTab('editor');
            // The entityId will be linked in the screenplay elements
            // scrollToEntityId will be handled by the tabNavigation
            navigateTo('screenplay', id);
          }}
        />
      )}
      {confirmModal && <ConfirmModal {...confirmModal} />}

      {/* ── VERSION PANEL ── */}
      {versionPanelOpen && (
        <div className="modal-overlay" onClick={() => setVersionPanelOpen(false)}>
          <div className="form-modal glass bg-black/95 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <h3 className="modal-title font-bold text-base text-white flex items-center gap-2">
                <Clock size={16} /> Versões
              </h3>
              <button onClick={() => setVersionPanelOpen(false)} className="btn-secondary py-1 px-2 text-xs">Fechar</button>
            </div>
            <div className="p-4">
              <VersionPanelView onClose={() => setVersionPanelOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── COVERAGE MODAL ── */}
      {coverageModal && (
        <div className="modal-overlay" onClick={() => setCoverageModal(false)}>
          <div className="form-modal glass bg-black/95 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <h3 className="modal-title font-bold text-base text-white flex items-center gap-2">
                <BarChart2 size={16} /> Análise de Roteiro
              </h3>
              <button onClick={() => setCoverageModal(false)} className="btn-secondary py-1 px-2 text-xs">Fechar</button>
            </div>
            <div className="p-4">
              <CoverageReport />
            </div>
          </div>
        </div>
      )}

      {/* ── CLASSIC SCRIPTS MODAL ── */}
      {classicScriptsModal && (
        <div className="modal-overlay" onClick={() => setClassicScriptsModal(false)}>
          <div className="form-modal glass bg-black/95 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <h3 className="modal-title font-bold text-base text-white flex items-center gap-2">
                <BookOpen size={16} /> Roteiros Clássicos
              </h3>
              <button onClick={() => setClassicScriptsModal(false)} className="btn-secondary py-1 px-2 text-xs">Fechar</button>
            </div>
            <div className="p-4">
              <ScriptBrowser />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
