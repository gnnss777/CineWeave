import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider, useSync } from './context/SyncContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';

const BrainstormTab = React.lazy(() => import('./components/BrainstormTab'));
const MindMapTab = React.lazy(() => import('./components/MindMapTab'));
const ScreenplayTab = React.lazy(() => import('./components/ScreenplayTab'));
const EncyclopediaTab = React.lazy(() => import('./components/EncyclopediaTab'));
import InstallPrompt from './components/InstallPrompt';
import UserMenu from './components/UserMenu';
import OnboardingOverlay from './components/OnboardingOverlay';
import ConfirmModal from './components/ConfirmModal';
import LoginPage from './components/LoginPage';
import InviteModal from './components/InviteModal';
import { FileText, BookOpen, Compass, Sparkles, Film, Plus, Trash2, HelpCircle, Cloud, Loader2, Globe, Lock, Hash, Users, Share2, Sun, Moon, Menu } from 'lucide-react';
import TagSelector from './components/TagSelector';

function HelpButton() {
  const { startTour } = useOnboarding();
  return (
    <button onClick={() => startTour('brainstorm')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }} title="Guia Interativo (G)">
      <HelpCircle size={14} />
      <span>Guia</span>
    </button>
  );
}

function TabLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7c7c82', gap: '12px', fontSize: '13px' }}>
      <Loader2 size={20} className="animate-spin" />
      <span>Carregando...</span>
    </div>
  );
}

function CineWeaveShell() {
  const { user, profile } = useAuth();
  const { isOnline, pendingCount } = useSync();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    projects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    addProject,
    deleteProject,
    syncAllToCloud,
    setProjectVisibility,
    setProjectTags,
    tabNavigation,
  } = useProject();
  const { startTour } = useOnboarding();

  const [activeTab, setActiveTab] = useState('brainstorm');
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTagline, setNewProjTagline] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [newProjVisibility, setNewProjVisibility] = useState('private');
  const [confirmModal, setConfirmModal] = useState(null);
  const [inviteModalProjectId, setInviteModalProjectId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMsg('Enviando para a nuvem...');
    try {
      await syncAllToCloud();
      setSyncMsg('Todos os projetos enviados para a nuvem!');
    } catch {
      setSyncMsg('Erro ao sincronizar. Veja o console.');
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 4000);
  };

  useEffect(() => {
    if (tabNavigation) {
      const redirectMap = { corkboard: 'encyclopedia', scripts: 'screenplay', coverage: 'screenplay', versions: 'screenplay' };
      const targetTab = redirectMap[tabNavigation.tab] || tabNavigation.tab;
      setActiveTab(targetTab);
    }
  }, [tabNavigation]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'g' || e.key === 'G') && 
          e.target.tagName !== 'INPUT' && 
          e.target.tagName !== 'TEXTAREA' && 
          !e.target.isContentEditable) {
        e.preventDefault();
        startTour('brainstorm');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTour]);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    addProject(newProjTitle, newProjTagline, '', '', newProjVisibility);
    setNewProjTitle('');
    setNewProjTagline('');
    setNewProjVisibility('private');
    setShowProjectDrawer(false);
  };

  const handleDeleteProject = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      title: 'Excluir Projeto',
      message: 'Tem certeza que deseja apagar este projeto? Todos os roteiros e fichas serão excluídos.',
      variant: 'danger',
      confirmLabel: 'Excluir',
      onConfirm: () => { deleteProject(id); setConfirmModal(null); },
      onCancel: () => setConfirmModal(null),
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'screenplay': return <ScreenplayTab />;
      case 'encyclopedia': return <EncyclopediaTab />;
      case 'mindmap': return <MindMapTab />;
      case 'brainstorm': return <BrainstormTab key={currentProject?.id} />;
      default: return <BrainstormTab key={currentProject?.id} />;
    }
  };

  return (
    <div className="shell-container">
      <header id="main-top-area" className="header-bar" style={{ zIndex: 'var(--z-error)' }}>
        <div className="logo-area">
          <button
            onClick={() => setShowProjectDrawer(!showProjectDrawer)}
            className="header-logo-btn"
          >
            <span className="desktop-only">
              <Film size={20} style={{ color: 'var(--primary-gold)' }} />
            </span>
            <span className="mobile-only">
              <Menu size={20} style={{ color: 'var(--primary-gold)' }} />
            </span>
            <span className="logo-text">CineWeave</span>
          </button>
        </div>

        <div className="header-desktop-nav" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => setActiveTab('screenplay')} className={`nav-item ${activeTab === 'screenplay' ? 'active' : ''}`}>
            <FileText size={16} /> Roteiro
          </button>
          <button onClick={() => setActiveTab('encyclopedia')} className={`nav-item ${activeTab === 'encyclopedia' ? 'active' : ''}`}>
            <BookOpen size={16} /> Enciclopédia
          </button>
          <button onClick={() => setActiveTab('mindmap')} className={`nav-item ${activeTab === 'mindmap' ? 'active' : ''}`}>
            <Compass size={16} /> Mapa Mental
          </button>
          <button onClick={() => setActiveTab('brainstorm')} className={`nav-item ${activeTab === 'brainstorm' ? 'active' : ''}`}>
            <Sparkles size={16} /> Ideias
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sync Status */}
          {!isOnline && (
            <div className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              Offline
            </div>
          )}
          {pendingCount > 0 && isOnline && (
            <div className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={10} className="animate-spin" />
              {pendingCount} pendente(s)
            </div>
          )}
          {isOnline && pendingCount === 0 && (
            <div style={{ padding: '4px 8px', fontSize: '10px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              Online
            </div>
          )}
          <HelpButton />
          <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '6px', fontSize: '12px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <UserMenu />
          <span className="desktop-only">
            <button 
              onClick={() => setShowProjectDrawer(!showProjectDrawer)} 
              className="btn-secondary"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
            >
              <Film size={14} style={{ color: 'var(--primary-gold)' }} />
              <span style={{ fontWeight: 700 }}>{currentProject?.title}</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>▼</span>
            </button>
          </span>
        </div>
      </header>

      <div className="app-body">
        <div className={`project-drawer ${showProjectDrawer ? 'open' : ''}`} onClick={() => setShowProjectDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h2 className="text-base font-bold text-yellow-500 flex items-center gap-1.5">
                <Film size={18} /> Projetos
              </h2>
              <button onClick={() => setShowProjectDrawer(false)} className="text-gray-500 hover:text-white text-xs">Fechar</button>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <TagSelector
                tags={filterTags}
                onChange={setFilterTags}
                placeholder="Filtrar por tags..."
              />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
              {projects
                .filter(p => filterTags.length === 0 || (p.tags || []).some(t => filterTags.includes(t)))
                .map((p) => (
                <div 
                  key={p.id} 
                  className={`project-card ${p.id === currentProjectId ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectId(p.id);
                    setShowProjectDrawer(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 className="text-sm font-bold text-white truncate">{p.title}</h3>
                      {p.visibility === 'public' ? (
                        <Globe size={10} style={{ color: '#4ade80', flexShrink: 0 }} title="Público" />
                      ) : p.visibility === 'shared' ? (
                        <Users size={10} style={{ color: '#818cf8', flexShrink: 0 }} title="Compartilhado" />
                      ) : (
                        <Lock size={10} style={{ color: '#f59e0b', flexShrink: 0 }} title="Privado" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.tagline || 'Sem subtítulo'}</p>
                    {p.tags && p.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {p.tags.map(t => (
                          <span key={t} style={{
                            fontSize: '9px', padding: '1px 6px', borderRadius: '8px',
                            background: 'rgba(204,238,0,0.1)', color: '#ccee00',
                            border: '1px solid rgba(204,238,0,0.2)',
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const visOptions = ['private', 'shared', 'public'];
                        const idx = visOptions.indexOf(p.visibility);
                        const newVis = visOptions[(idx + 1) % visOptions.length];
                        setProjectVisibility(p.id, newVis);
                      }}
                      style={{
                        padding: '2px 6px',
                        background: p.visibility === 'public' ? 'rgba(74,222,128,0.1)' : p.visibility === 'shared' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${p.visibility === 'public' ? 'rgba(74,222,128,0.3)' : p.visibility === 'shared' ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        borderRadius: '6px',
                        color: p.visibility === 'public' ? '#4ade80' : p.visibility === 'shared' ? '#818cf8' : '#f59e0b',
                        cursor: 'pointer',
                        fontSize: '9px',
                        fontWeight: 'bold',
                      }}
                      title="Alterar visibilidade"
                    >
                      {p.visibility === 'public' ? 'Público' : p.visibility === 'shared' ? 'Compartilhado' : 'Privado'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setInviteModalProjectId(p.id); }}
                      className="text-gray-600 hover:text-indigo-400 p-1"
                      title="Compartilhar projeto"
                    >
                      <Users size={14} />
                    </button>
                    {projects.length > 1 && (
                      <button 
                        onClick={(e) => handleDeleteProject(p.id, e)}
                        className="text-gray-600 hover:text-red-500 p-1"
                        title="Deletar Projeto"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSyncAll} disabled={syncing} style={{ width: '100%', padding: '8px', background: syncMsg.includes('enviados') ? 'rgba(74,222,128,0.12)' : 'rgba(204,238,0,0.08)', border: '1px solid ' + (syncMsg.includes('enviados') ? 'rgba(74,222,128,0.3)' : 'rgba(204,238,0,0.2)'), borderRadius: '6px', color: syncMsg.includes('enviados') ? '#4ade80' : '#ccee00', fontSize: '11px', fontWeight: 'bold', cursor: syncing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} title="Enviar todos os projetos para a nuvem">
              {syncing ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />} {syncMsg || 'Sincronizar Tudo na Nuvem'}
            </button>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3 border-t border-gray-800 pt-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500">Novo Filme</h3>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400">Título do Roteiro:</label>
                <input 
                  type="text" 
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="Ex: Shadows of Neon"
                  className="p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-yellow-600"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400">Tagline / Subtítulo:</label>
                <input 
                  type="text" 
                  value={newProjTagline}
                  onChange={(e) => setNewProjTagline(e.target.value)}
                  placeholder="Ex: Na cidade fria, memórias mentem."
                  className="p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-yellow-600"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400">Visibilidade inicial:</label>
                <select
                  value={newProjVisibility}
                  onChange={(e) => setNewProjVisibility(e.target.value)}
                  className="p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs focus:outline-none focus:border-yellow-600"
                >
                  <option value="private">Privado</option>
                  <option value="shared">Compartilhado</option>
                  <option value="public">Público</option>
                </select>
              </div>
              <button type="submit" className="btn-primary py-2 text-xs justify-center">
                <Plus size={14} /> Criar Novo Roteiro
              </button>
            </form>
          </div>
        </div>

        <main className="main-content-pane">
          <Suspense fallback={<TabLoader />}>
            {renderTabContent()}
          </Suspense>
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        <button className={`mobile-nav-btn ${activeTab === 'screenplay' ? 'active' : ''}`} onClick={() => setActiveTab('screenplay')}>
          <FileText size={18} />
          <span>Roteiro</span>
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'encyclopedia' ? 'active' : ''}`} onClick={() => setActiveTab('encyclopedia')}>
          <BookOpen size={18} />
          <span>Enciclopédia</span>
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'mindmap' ? 'active' : ''}`} onClick={() => setActiveTab('mindmap')}>
          <Compass size={18} />
          <span>Mapa Mental</span>
        </button>
        <button className={`mobile-nav-btn ${activeTab === 'brainstorm' ? 'active' : ''}`} onClick={() => setActiveTab('brainstorm')}>
          <Sparkles size={18} />
          <span>Ideias</span>
        </button>
      </nav>

      <InstallPrompt />
      {confirmModal && <ConfirmModal {...confirmModal} />}
      {inviteModalProjectId && <InviteModal projectId={inviteModalProjectId} onClose={() => setInviteModalProjectId(null)} />}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#fff', background: '#990000', padding: '40px', fontSize: '20px', fontFamily: 'sans-serif', minHeight: '100vh', zIndex: 'var(--z-error)', position: 'relative' }}>
          <h2>Algo deu errado (React Crash):</h2>
          <pre style={{ background: '#000', padding: '20px', overflow: 'auto', color: '#ffaaaa', fontSize: '14px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error && this.state.error.stack}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '10px', fontSize: '16px', marginTop: '20px', cursor: 'pointer', background: '#fff', color: '#000' }}>Limpar Todos os Dados e Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthenticatedApp() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#ccee00' }} />
        <span style={{ color: '#666', fontSize: '13px' }}>Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SyncProvider>
          <ProjectProvider>
            <OnboardingProvider>
              <CineWeaveShell />
              <OnboardingOverlay />
            </OnboardingProvider>
          </ProjectProvider>
        </SyncProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
