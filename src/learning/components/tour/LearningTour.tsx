// src/learning/components/tour/LearningTour.tsx
// Tooltip de Onboarding pasivo (Maquina de Estados Determinista)
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { useLearning } from '../../context/LearningContext';
import { flowSteps } from '../../data/flows';
import type { StepDef } from '../../data/flows';

interface Pos {
  top: number;
  left: number;
  arrowDir: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

const TW = 360; 
const TH = 220; 
const GAP = 16;
const PAD = 10; 

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function calcPosition(el: Element | null, preferredPlacement: string): Pos {
  if (!el || preferredPlacement === 'center') {
    return {
      top: window.innerHeight / 2 - TH / 2,
      left: window.innerWidth / 2 - TW / 2,
      arrowDir: 'none',
    };
  }

  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceRight = vw - r.right;
  const spaceLeft = r.left;
  const spaceBottom = vh - r.bottom;


  let placement = preferredPlacement;
  if (placement === 'auto') {
    if (spaceRight >= TW + GAP) placement = 'right';
    else if (spaceLeft >= TW + GAP) placement = 'left';
    else if (spaceBottom >= TH + GAP) placement = 'bottom';
    else placement = 'top';
  }

  let top = 0, left = 0;
  let arrowDir: Pos['arrowDir'] = 'none';

  if (placement === 'right') {
    top = clamp(r.top + r.height / 2 - TH / 2, 16, vh - TH - 16);
    left = clamp(r.right + GAP, 16, vw - TW - 16);
    arrowDir = 'left';
  } else if (placement === 'left') {
    top = clamp(r.top + r.height / 2 - TH / 2, 16, vh - TH - 16);
    left = clamp(r.left - TW - GAP, 16, vw - TW - 16);
    arrowDir = 'right';
  } else if (placement === 'top') {
    top = clamp(r.top - TH - GAP, 16, vh - TH - 16);
    left = clamp(r.left + r.width / 2 - TW / 2, 16, vw - TW - 16);
    arrowDir = 'bottom';
  } else {
    top = clamp(r.bottom + GAP, 16, vh - TH - 16);
    left = clamp(r.left + r.width / 2 - TW / 2, 16, vw - TW - 16);
    arrowDir = 'top';
  }

  return { top, left, arrowDir };
}

export default function LearningTour() {
  const { 
    activeFlow, 
    activeStepIndex, 
    flowState, 
    validationError, 
    nextStep, 
    prevStep, 
    finishFlow 
  } = useLearning();

  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, arrowDir: 'none' });
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);

  const steps: StepDef[] = activeFlow ? (flowSteps[activeFlow] || []) : [];
  const currentStep = steps[activeStepIndex] as StepDef | undefined;
  const isLastStep = activeStepIndex === steps.length - 1;
  const isCenter = !currentStep?.target || currentStep.target === 'body' || currentStep.placement === 'center';

  const updatePos = useCallback(() => {
    if (!currentStep) return;
    const el = isCenter ? null : document.querySelector(currentStep.target);
    
    // Auto-scroll pasivo para centrar el elemento objetivo
    if (el) {
      const rect = el.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const newPos = calcPosition(el, currentStep.placement || 'auto');
    setPos(newPos);
    setSpotRect(el ? el.getBoundingClientRect() : null);
  }, [currentStep, isCenter]);

  // Actualizar visibilidad al cambiar de flujo o de paso
  useEffect(() => {
    if (!activeFlow || !currentStep) {
      setVisible(false);
      setEntering(false);
      return;
    }

    setVisible(true);
    setEntering(false);
    
    const t = setTimeout(() => {
      updatePos();
      setEntering(true);
    }, 150);

    return () => clearTimeout(t);
  }, [activeFlow, activeStepIndex, currentStep, updatePos]);

  // Renderizar la posición al redimensionar la ventana o hacer scroll
  useEffect(() => {
    if (!visible) return;
    window.addEventListener('resize', updatePos);
    // Escuchar scroll en fase de captura para detectar scroll dentro de contenedores overflow/modales
    window.addEventListener('scroll', updatePos, { capture: true, passive: true });
    
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, { capture: true });
    };
  }, [visible, updatePos]);

  console.log('[DEBUG TOUR] RENDER:', { activeFlow, hasCurrentStep: !!currentStep, visible });

  if (!activeFlow || !currentStep) return null;

  const sr = spotRect;
  const hasSpot = sr && !isCenter;
  const isWaitingValidation = flowState === 'WAITING_VALIDATION';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99990, pointerEvents: 'none' }}>
      
      {/* ── Overlay visual oscuro ( pointer-events: none, no bloquea clics en inputs) ── */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <mask id="tm">
            <rect width="100%" height="100%" fill="white" />
            {hasSpot && (
              <rect
                x={sr.left - PAD} y={sr.top - PAD}
                width={sr.width + PAD * 2} height={sr.height + PAD * 2}
                rx="10" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,18,40,0.65)" mask="url(#tm)" style={{ pointerEvents: 'none' }} />
      </svg>

      {hasSpot && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <rect
            x={sr.left - PAD} y={sr.top - PAD}
            width={sr.width + PAD * 2} height={sr.height + PAD * 2}
            rx="10" fill="none"
            stroke="url(#spotlight-grad)" strokeWidth="2.5"
          />
          <defs>
            <linearGradient id="spotlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Tooltip de ayuda */}
      <div
        style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          width: TW,
          pointerEvents: 'auto',
          opacity: 1,
          transform: 'scale(1) translateY(0)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >
        {pos.arrowDir === 'left' && (
          <div style={{ position: 'absolute', left: -8, top: '50%', marginTop: -8, borderRight: '8px solid #4f46e5', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }} />
        )}
        {pos.arrowDir === 'right' && (
          <div style={{ position: 'absolute', right: -8, top: '50%', marginTop: -8, borderLeft: '8px solid #4f46e5', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }} />
        )}
        {pos.arrowDir === 'top' && (
          <div style={{ position: 'absolute', top: -8, left: '50%', marginLeft: -8, borderBottom: '8px solid #4f46e5', borderLeft: '8px solid transparent', borderRight: '8px solid transparent' }} />
        )}
        {pos.arrowDir === 'bottom' && (
          <div style={{ position: 'absolute', bottom: -8, left: '50%', marginLeft: -8, borderTop: '8px solid white', borderLeft: '8px solid transparent', borderRight: '8px solid transparent' }} />
        )}

        <div style={{
          background: 'white',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,58,237,0.1)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Asistente Marketdev</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                  Paso {activeStepIndex + 1} de {steps.length}
                </div>
              </div>
            </div>
            <button
              onClick={finishFlow}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ height: 3, background: '#f1f5f9', display: 'flex', gap: 2, padding: '0 1px' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '100%',
                  background: i <= activeStepIndex ? '#7c3aed' : '#e2e8f0',
                  transition: 'background 0.3s',
                  borderRadius: 2,
                }}
              />
            ))}
          </div>

          <div style={{ padding: '18px 18px 8px' }}>
            {currentStep.title && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#4f46e5' }}>{currentStep.title}</span>
              </div>
            )}
            <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {currentStep.content}
            </p>
            {currentStep.helpText && (
              <div style={{
                marginTop: 10,
                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                borderRadius: 10,
                padding: '10px 12px',
                border: '1px solid #ddd6fe',
              }}>
                <p style={{ color: '#5b21b6', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  💡 {currentStep.helpText}
                </p>
              </div>
            )}
          </div>

          <div style={{
            padding: '12px 18px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <button
              onClick={prevStep}
              disabled={activeStepIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: activeStepIndex === 0 ? '#cbd5e1' : '#64748b',
                cursor: activeStepIndex === 0 ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: 8,
              }}
            >
              <ChevronLeft size={15} /> Atrás
            </button>

            {isWaitingValidation ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fef2f2',
                borderRadius: 20,
                padding: '7px 14px',
                border: '1px solid #fecaca',
              }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                <span style={{ color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                  {validationError || 'Completa el campo...'}
                </span>
              </div>
            ) : (
              <button
                onClick={nextStep}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: 'none',
                  color: 'white',
                  padding: '9px 18px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {isLastStep ? '¡Listo! 🎉' : 'Siguiente'}
                {!isLastStep && <ChevronRight size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
