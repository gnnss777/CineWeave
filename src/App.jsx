import React, { useState, useEffect } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import BrainstormTab from './components/BrainstormTab';
import MindMapTab from './components/MindMapTab';
import ScreenplayTab from './components/ScreenplayTab';
import EncyclopediaTab from './components/EncyclopediaTab';
import CorkboardTab from './components/CorkboardTab';
import ScriptBrowser from './components/ScriptBrowser';
import CoverageReport from './components/CoverageReport';
import InstallPrompt from './components/InstallPrompt';
import LoginModal from './components/LoginModal';
import OnboardingOverlay from './components/OnboardingOverlay';
import { Radio, Compass, FileText, BookOpen, Columns, Film, Plus, Trash2, HelpCircle, Book, BarChart3 } from 'lucide-react';

function HelpButton() {
  const { startTour, hasCompleted } = useOnboarding();
  
  const showMainTour = () => startTour('brainstorm');
  
  return (
    <button
      onClick={showMainTour}
      className="btn-secondary"
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
      title="Guia Interativo (G)"
    >
      <HelpCircle size={14} />
      <span>Guia</span>
    </button>
  );
}

function CineWeaveShell() {
  const { 
    projects, 
    currentProject, 
    currentProjectId, 
    setCurrentProjectId, 
    addProject, 
    deleteProject,
    tabNavigation
  } = useProject();
  const { startTour } = useOnboarding();

  const [activeTab, setActiveTab] = useState('brainstorm');
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTagline, setNewProjTagline] = useState('');

  // Cross-tab navigation: listen for navigateTo calls
  useEffect(() => {
    if (tabNavigation) {
      setActiveTab(tabNavigation.tab);
    }
  }, [tabNavigation]);

  // Global keyboard shortcut for guide (G key)
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
    addProject(newProjTitle, newProjTagline);
    setNewProjTitle('');
    setNewProjTagline('');
    setShowProjectDrawer(false);
  };

  const handleDeleteProject = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja apagar este projeto? Todos os roteiros e fichas serão excluídos.')) {
      deleteProject(id);
    }
  };

  // Render proper tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'brainstorm': return <BrainstormTab />;
      case 'mindmap': return <MindMapTab />;
      case 'screenplay': return <ScreenplayTab />;
      case 'corkboard': return <CorkboardTab />;
      case 'encyclopedia': return <EncyclopediaTab />;
      case 'scripts': return <ScriptBrowser />;
      case 'coverage': return <CoverageReport />;
      default: return <BrainstormTab />;
    }
  };

  return (
    <div className="shell-container">

      {/* Header bar — Anti-AdBlock / Anti-CSS Override */}
      <header id="main-top-area" style={{ background: '#111111', height: '60px', minHeight: '60px', borderBottom: '2px solid rgba(204, 238, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0, position: 'relative', zIndex: 99999 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={20} style={{ color: '#ccee00' }} />
          <span style={{ color: '#ccee00', fontSize: '20px', margin: 0, fontWeight: 'bold', fontFamily: 'sans-serif' }}>CineWeave</span>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('brainstorm')} 
            style={{ color: activeTab === 'brainstorm' ? '#ccee00' : '#ffffff', background: activeTab === 'brainstorm' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'brainstorm' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <Radio size={16} />
            Brainstorm
          </button>
          <button 
            onClick={() => setActiveTab('mindmap')} 
            style={{ color: activeTab === 'mindmap' ? '#ccee00' : '#ffffff', background: activeTab === 'mindmap' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'mindmap' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <Compass size={16} />
            Mapa
          </button>
          <button 
            onClick={() => setActiveTab('screenplay')} 
            style={{ color: activeTab === 'screenplay' ? '#ccee00' : '#ffffff', background: activeTab === 'screenplay' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'screenplay' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <FileText size={16} />
            Roteiro
          </button>
          <button 
            onClick={() => setActiveTab('encyclopedia')} 
            style={{ color: activeTab === 'encyclopedia' ? '#ccee00' : '#ffffff', background: activeTab === 'encyclopedia' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'encyclopedia' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <BookOpen size={16} />
            Fichas
          </button>
          <button 
            onClick={() => setActiveTab('corkboard')} 
            style={{ color: activeTab === 'corkboard' ? '#ccee00' : '#ffffff', background: activeTab === 'corkboard' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'corkboard' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <Columns size={16} />
            Mural
          </button>
          <button 
            onClick={() => setActiveTab('scripts')} 
            style={{ color: activeTab === 'scripts' ? '#ccee00' : '#ffffff', background: activeTab === 'scripts' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'scripts' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <Book size={16} />
            Roteiros
          </button>
          <button 
            onClick={() => setActiveTab('coverage')} 
            style={{ color: activeTab === 'coverage' ? '#ccee00' : '#ffffff', background: activeTab === 'coverage' ? 'rgba(204, 238, 0, 0.08)' : 'transparent', border: activeTab === 'coverage' ? '1px solid #ccee00' : '1px solid #555', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}
          >
            <BarChart3 size={16} />
            Coverage
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpButton />
          <LoginModal />
          <button 
            onClick={() => setShowProjectDrawer(!showProjectDrawer)} 
            className="btn-secondary"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Film size={14} style={{ color: 'var(--primary-gold)' }} />
            <span style={{ fontWeight: 700 }}>{currentProject?.title}</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>▼</span>
          </button>
        </div>
      </header>

      {/* Core Layout Grid */}
      <div className="app-body">
        {/* Project Drawer Overlay */}
        <div className={`project-drawer ${showProjectDrawer ? 'open' : ''}`} onClick={() => setShowProjectDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h2 className="text-base font-bold text-yellow-500 flex items-center gap-1.5">
                <Film size={18} /> Projetos Cinematográficos
              </h2>
              <button onClick={() => setShowProjectDrawer(false)} className="text-gray-500 hover:text-white text-xs">Fechar</button>
            </div>

            {/* List of projects */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  className={`project-card ${p.id === currentProjectId ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectId(p.id);
                    setShowProjectDrawer(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{p.title}</h3>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.tagline || 'Sem subtítulo'}</p>
                  </div>
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
              ))}
            </div>

            {/* Create new project form */}
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
              <button type="submit" className="btn-primary py-2 text-xs justify-center">
                <Plus size={14} /> Criar Novo Roteiro
              </button>
            </form>
          </div>
        </div>

        {/* Interactive Main View Area */}
        <main className="main-content-pane">
          {renderTabContent()}
        </main>
      </div>

      <InstallPrompt />
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
        <div style={{ color: '#fff', background: '#990000', padding: '40px', fontSize: '20px', fontFamily: 'sans-serif', minHeight: '100vh', zIndex: 999999, position: 'relative' }}>
          <h2>Algo deu errado (React Crash):</h2>
          <pre style={{ background: '#000', padding: '20px', overflow: 'auto', color: '#ffaaaa', fontSize: '14px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error && this.state.error.stack}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '10px', fontSize: '16px', marginTop: '20px', cursor: 'pointer', background: '#fff', color: '#000' }}>Limpar Todos os Dados e Recarregar (Perderá os projetos não salvos na nuvem)</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ProjectProvider>
        <OnboardingProvider>
          <CineWeaveShell />
          <OnboardingOverlay />
        </OnboardingProvider>
      </ProjectProvider>
    </ErrorBoundary>
  )
}

export default App;
