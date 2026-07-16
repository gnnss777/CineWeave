import React, { useState } from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { Projector, Brain, Compass, FileText, BookOpen, Sparkles, Layers, Globe, Target, MessageSquare, Feather, Plus, CircleCheck } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { startTour, hasCompleted } = useOnboarding();
  const [activeTour, setActiveTour] = useState(null);

  const tours = [
    {
      id: 'brainstorm',
      title: 'Brainstorm',
      icon: Sparkles,
      description: 'Grave ideias por voz, escreva sinopse e deixe a IA extrair sua estrutura narrativa.',
      completed: hasCompleted?.brainstorm,
      color: 'from-red-500 to-yellow-400'
    },
    {
      id: 'encyclopedia',
      title: 'Enciclopédia',
      icon: BookOpen,
      description: 'Crie fichas detalhadas de personagens, locações, objetos e elementos do seu universo.',
      completed: hasCompleted?.encyclopedia,
      color: 'from-blue-500 to-purple-400'
    },
    {
      id: 'mindmap',
      title: 'Mapa Mental',
      icon: Compass,
      description: 'Visualize todas as conexões entre atos, cenas, personagens e elementos do seu filme.',
      completed: hasCompleted?.mindmap,
      color: 'from-green-500 to-teal-400'
    },
    {
      id: 'screenplay',
      title: 'Roteiro',
      icon: FileText,
      description: 'Escreva em formato Hollywood com IA co-escritor, autocompletar e controle de versões.',
      completed: hasCompleted?.screenplay,
      color: 'from-amber-500 to-orange-400'
    }
  ];

  const handleStartTour = (tourId) => {
    onClose();
    startTour(tourId);
  };

  const handleStartFullTour = () => {
    onClose();
    // Start full tour sequence
    startTour('brainstorm');
    // Note: We'd need to extend OnboardingContext to support chaining tours
    // For now, we'll just start with brainstorm and user can continue manually
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
          aria-label="Fechar guia"
        >
          <CircleCheck size={20} />
        </button>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-8 glass border border-yellow-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Bem-vindo ao CineWeave
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              O CineWeave é seu estúdio criativo completo: desde a primeira ideia até o roteiro finalizado. 
              Este guia mostra como cada parte trabalha junto para transformar sua visão em filme.
            </p>
          </div>

          {/* Tour Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {tours.map(tour => (
              <div
                key={tour.id}
                className={`group cursor-pointer border border-yellow-500/20 rounded-xl p-5 hover:border-yellow-500/40 hover:bg-black/30 transition-all`}
                onClick={() => setActiveTour(tour.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center mb-2">
                    <tour.icon size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{tour.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-3">{tour.description}</p>
                    {tour.completed && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                        Concluído
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Tour Details */}
          {activeTour && (
            <div className="border-t border-yellow-500/20 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Tour: {tours.find(t => t.id === activeTour)?.title}
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setActiveTour(null);
                    handleStartTour(activeTour);
                  }}
                  className="w-full btn-primary py-3 px-6 text-lg font-bold flex items-center justify-center gap-3"
                >
                  Iniciar Tour
                  <Play size={20} />
                </button>
                <button
                  onClick={() => setActiveTour(null)}
                  className="w-full btn-secondary py-3 px-6 text-sm"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Full Tour Option */}
          <div className="border-t border-yellow-500/20 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tour Completo</h2>
            <p className="text-gray-400 mb-4">
              Experimente todo o fluxo criativo: Brainstorm → Enciclopédia → Mapa Mental → Roteiro
            </p>
            <button
              onClick={handleStartFullTour}
              className="w-full btn-primary py-3 px-6 text-lg font-bold flex items-center justify-center gap-3"
            >
              Começar Tour Completo
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Tips */}
          <div className="border-t border-yellow-500/20 pt-6">
            <h3 className="font-semibold text-white mb-3">Dicas</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <Grab size={14} className="mt-1 text-yellow-400 flex-shrink-0" />
                <span>Pressione <kbd className="px-2 py-1 text-xs bg-white/10 rounded">G</kbd> a qualquer momento para abrir este guia</span>
              </div>
              <div className="flex items-start space-x-2">
                <Lightbulb size={14} className="mt-1 text-yellow-400 flex-shrink-0" />
                <span>Tours salvam seu progresso - você pode pausar e continuar depois</span>
              </div>
              <div className="flex items-start space-x-2">
                <RefreshCw size={14} className="mt-1 text-yellow-400 flex-shrink-0" />
                <span>Recomendamos seguir a ordem: Brainstorm → Enciclopédia → Mapa Mental → Roteiro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components for tips (using lucide icons)
function Grab() {
  return (
    <path
      d="M10 3v2m0 14v2m4-16v2m0 14v2m4-16v2m0 14v2m4-16v2m0 14v2m2-16h.01M2 3h2m14 0h2M6 7h2m10 0h2M6 11h2m10 0h2M6 15h2m10 0h2M2 7h2m14 0h2M2 11h2m14 0h2M2 15h2m14 0h2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Lightbulb() {
  return (
    <>
      <path d="M15 14a2 2 0 01-2 2H7l-.5 1H6a2 2 0 01-2-2V6.414a2 2 0 114 0V14z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 18v.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function RefreshCw() {
  return (
    <path
      d="M4 4v5h5M4 4a9 9 0 009 9 9 9 0 009-9"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Play() {
  return (
    <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );
}

function ArrowRight() {
  return (
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="12 5 19 12 12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  );
}