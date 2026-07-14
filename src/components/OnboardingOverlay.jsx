import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export default function OnboardingOverlay({
  isActive,
  currentStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef(null);

  // Find and measure target element
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        return true;
      }
      return false;
    };

    // Try immediately
    if (!findTarget()) {
      // Retry after a short delay for dynamic content
      const timer = setTimeout(findTarget, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep]);

  // Calculate tooltip position
  useEffect(() => {
    if (!targetRect || !currentStep) return;

    const padding = 20;
    const tooltipWidth = 360;
    const tooltipHeight = 200; // approximate
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = targetRect.top;
    let left = targetRect.left;

    switch (currentStep.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      case 'center':
      default:
        top = viewportHeight / 2 - tooltipHeight / 2;
        left = viewportWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

    setTooltipPosition({ top, left });
  }, [targetRect, currentStep]);

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Backdrop with spotlight hole */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{
          clipPath: targetRect
            ? `polygon(
                0 0, 100% 0, 100% 100%, 0 100%,
                0 0,
                ${targetRect.left - 8}px ${targetRect.top - 8}px,
                ${targetRect.right + 8}px ${targetRect.top - 8}px,
                ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                ${targetRect.left - 8}px ${targetRect.bottom + 8}px
              )`
            : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        }}
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Highlight ring on target */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 3px #ccee00, 0 0 20px 5px #ccee00',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={overlayRef}
        className="fixed z-50 glass border border-yellow-500/30 rounded-2xl p-5 max-w-xs w-full shadow-2xl animate-slide-up"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: 360,
        }}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-content"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-yellow-500 font-bold">
              {currentStepIndex + 1} / {totalSteps}
            </span>
            <h3 id="onboarding-title" className="text-lg font-bold text-white">
              {currentStep.title}
            </h3>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Pular tour"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <p id="onboarding-content" className="text-gray-300 text-sm leading-relaxed mb-4">
          {currentStep.content}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => i < totalSteps && i <= currentStepIndex + 1 && (i === currentStepIndex ? null : (i < currentStepIndex ? onPrev : onNext))}
              disabled={i > currentStepIndex + 1}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStepIndex
                  ? 'bg-yellow-500 w-6'
                  : i < currentStepIndex
                  ? 'bg-green-500'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Passo ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            className="btn-secondary py-2 px-4 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} className="mr-1" /> Voltar
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="btn-ghost py-2 px-4 text-sm rounded-lg text-gray-400 hover:text-white"
            >
              Pular
            </button>
            <button
              onClick={currentStepIndex === totalSteps - 1 ? onNext : onNext}
              className="btn-primary py-2 px-5 text-sm font-bold rounded-lg flex items-center gap-1.5"
            >
              {currentStepIndex === totalSteps - 1 ? (
                <>
                  Concluir <Check size={16} />
                </>
              ) : (
                <>
                  Próximo <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 3px #ccee00, 0 0 20px 5px #ccee00; }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 5px #ccee00, 0 0 30px 10px #ccee00; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </>
  );
}