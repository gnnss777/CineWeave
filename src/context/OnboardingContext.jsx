import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import OnboardingOverlay from '../components/OnboardingOverlay';

const OnboardingContext = createContext();

export const ONBOARDING_STEPS = {
  brainstorm: [
    {
      id: 'brainstorm-welcome',
      target: '[data-onboarding="brainstorm-tab"]',
      title: 'Bem-vindo ao Brainstorm!',
      content: 'Aqui é onde tudo começa. Grave suas ideias por voz, escreva a sinopse ou envie anotações e imagens. O CineWeave transforma tudo em estrutura narrativa.',
      position: 'bottom',
    },
{
      id: 'brainstorm-record',
      target: '[data-onboarding="brainstorm-record"]',
      title: 'Gravar por Voz',
      content: 'Clique no microfone e fale livremente. A transcrição acontece em tempo real (Chrome/Edge). Você pode editar o texto antes de salvar.',
      position: 'right',
    },
    {
      id: 'brainstorm-synopsis',
      target: '[data-onboarding="brainstorm-synopsis"]',
      title: 'Sinopse / História',
      content: 'Cole aqui o resumo da sua história. A IA vai extrair personagens, locais, objetos e sugerir cenas organizadas por Atos.',
      position: 'right',
    },
    {
      id: 'brainstorm-process',
      target: '[data-onboarding="brainstorm-process"]',
      title: 'Processar com IA',
      content: 'Após gravar ou escrever, clique aqui. A IA analisa tudo, cria fichas de personagens, locações, objetos e monta o Mapa Mental + Roteiro automaticamente.',
      position: 'left',
    },
    {
      id: 'brainstorm-history',
      target: '[data-onboarding="brainstorm-history"]',
      title: 'Histórico de Captação',
      content: 'Tudo o que você gravou ou enviou fica aqui. Itens com ✓ já viraram estrutura no Mapa Mental. Pendentes (amarelo) ainda podem ser processados.',
      position: 'left',
    },
  ],
  mindmap: [
    {
      id: 'mindmap-welcome',
      target: '[data-onboarding="mindmap-tab"]',
      title: 'Mapa Mental Visual',
      content: 'Veja toda a estrutura do seu filme de uma vez. Atos, Cenas, Personagens, Locações e Objetos conectados semanticamente.',
      position: 'bottom',
    },
    {
      id: 'mindmap-navigate',
      target: '[data-onboarding="mindmap-canvas"]',
      title: 'Navegação',
      content: 'Arraste o fundo para mover. Use scroll para zoom. Clique num nó para ver detalhes ou editar. Nós se atraem por conexões semânticas.',
      position: 'center',
    },
    {
      id: 'mindmap-add-node',
      target: '[data-onboarding="mindmap-add-node"]',
      title: 'Adicionar Nó (Click-to-Place)',
      content: 'Clique em "Novo Nó" e depois clique em qualquer área livre do canvas. O nó será criado exatamente onde você clicou. Escolha o tipo: Cena, Ato, Personagem, Locação ou Objeto.',
      position: 'top',
    },
    {
      id: 'mindmap-connect',
      target: '[data-onboarding="mindmap-connector"]',
      title: 'Criar Conexões',
      content: 'Arraste a partir do círculo pequeno no nó para conectar a outro nó. Isso cria relações semânticas (ex: Personagem → Locação onde aparece).',
      position: 'left',
    },
    {
      id: 'mindmap-sidebar',
      target: '[data-onboarding="mindmap-sidebar"]',
      title: 'Painel de Fichas',
      content: 'Aqui você vê todas as fichas criadas (Personagens, Locações, Objetos, Atos). Clique para centralizar no mapa ou editar.',
      position: 'left',
    },
  ],
  screenplay: [
    {
      id: 'screenplay-welcome',
      target: '[data-onboarding="screenplay-tab"]',
      title: 'Editor de Roteiro Profissional',
      content: 'Formatação padrão Hollywood automática. Digite e o CineWeave detecta: INT./EXT., Personagem, Diálogo, Parêntese, Transição.',
      position: 'bottom',
    },
    {
      id: 'screenplay-autocomplete',
      target: '[data-onboarding="screenplay-editor"]',
      title: 'Autocompletar Inteligente',
      content: 'Digite nome de personagem ou INT./EXT. + nome da locação — o CineWeave sugere baseado no seu projeto. Tab para aceitar.',
      position: 'top',
    },
    {
      id: 'screenplay-ai',
      target: '[data-onboarding="screenplay-ai"]',
      title: 'Co-Escritor IA',
      content: 'Clique na estrela ✨ em qualquer linha para a IA continuar a cena. Escolha o tom: Drama, Mistério, Comédia, Ação.',
      position: 'right',
    },
    {
      id: 'screenplay-outline',
      target: '[data-onboarding="screenplay-outline"]',
      title: 'Estrutura / Outline',
      content: 'A barra lateral mostra todas as cenas (cabeçalhos). Clique para pular. Arraste para reordenar. A paginação é automática (1 pág ≈ 1 min).',
      position: 'left',
    },
    {
      id: 'screenplay-shortcuts',
      target: '[data-onboarding="screenplay-shortcuts"]',
      title: 'Atalhos de Poder',
      content: 'Ctrl+1..6 = trocar tipo de bloco | Enter = nova linha inteligente | Alt+↑/↓ = mover bloco | Ctrl+D = duplicar | Alt+Backspace = apagar bloco',
      position: 'left',
    },
  ],
  encyclopedia: [
    {
      id: 'encyclopedia-welcome',
      target: '[data-onboarding="encyclopedia-tab"]',
      title: 'Enciclopédia do Projeto',
      content: 'Todas as fichas detalhadas: Personagens (arquetipo, backstory, traits), Locações (tipo, mood, horário), Objetos (significado). Tudo editável e sincronizado com o Mapa.',
      position: 'bottom',
    },
    {
      id: 'encyclopedia-create',
      target: '[data-onboarding="encyclopedia-create"]',
      title: 'Criar Fichas Manualmente',
      content: 'Além da IA, você pode criar fichas do zero aqui. Elas aparecem no Mapa Mental e no Roteiro automaticamente.',
      position: 'right',
    },
  ],
  global: [
    {
      id: 'global-projects',
      target: '[data-onboarding="project-selector"]',
      title: 'Múltiplos Projetos',
      content: 'Clique no nome do filme no topo para trocar ou criar novos roteiros. Cada projeto é isolado com seu próprio mapa, roteiro e fichas.',
      position: 'bottom',
    },
    {
      id: 'global-zen',
      target: '[data-onboarding="zen-mode"]',
      title: 'Modo Zen (Roteiro)',
      content: 'No editor de roteiro, clique no ícone de minimizar para entrar no Modo Zen — tela cheia, sem distrações, só você e a escrita.',
      position: 'left',
    },
  ],
};

export function OnboardingProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentTour, setCurrentTour] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(() => {
    const saved = localStorage.getItem('cineweave_onboarding_completed');
    return saved ? JSON.parse(saved) : {};
  });

  const startTour = useCallback((tourKey) => {
    const steps = ONBOARDING_STEPS[tourKey] || [];
    if (steps.length === 0) return;
    setCurrentTour(tourKey);
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (!currentTour) return;
    const steps = ONBOARDING_STEPS[currentTour];
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentTour, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const completeTour = useCallback(() => {
    if (currentTour) {
      setHasCompleted(prev => {
        const next = { ...prev, [currentTour]: true };
        localStorage.setItem('cineweave_onboarding_completed', JSON.stringify(next));
        return next;
      });
    }
    setIsActive(false);
    setCurrentTour(null);
    setCurrentStepIndex(0);
  }, [currentTour]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const currentStep = currentTour ? ONBOARDING_STEPS[currentTour]?.[currentStepIndex] : null;

  return (
    <OnboardingContext.Provider value={{
      isActive,
      currentStep,
      currentStepIndex,
      totalSteps: currentTour ? ONBOARDING_STEPS[currentTour]?.length : 0,
      currentTour,
      hasCompleted,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
    }}>
      {children}
      <OnboardingOverlay
        isActive={isActive}
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={currentTour ? ONBOARDING_STEPS[currentTour]?.length : 0}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}