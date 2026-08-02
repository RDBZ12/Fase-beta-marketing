// src/learning/context/LearningContext.tsx
// Contexto Centralizado del Motor de Aprendizaje - Marketdev
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flowSteps } from '../data/flows';
import type { StepDef } from '../data/flows';
import { LearningDispatcher } from '../services/LearningDispatcher';
import type { LearningAction } from '../services/LearningDispatcher';

// UIState Centralizado
export interface UIState {
  currentModule: string;
  currentScreen: string;
  currentModal: string | null;
  currentWizardStep: number | null;
  formValues: {
    businessName?: string;
    budget?: number;
    description?: string;
    targetAudience?: string;
    mainObjective?: string;
    socialNetwork?: string;
    startDate?: string;
    socialDestination?: string;
    endDate?: string;
    taxName?: string;
    taxRnc?: string;
    whatsappPhone?: string;
  };
  taxSaved?: boolean;
  whatsappConnected?: boolean;
  onboardingWelcome?: boolean;
}

export type FlowState =
  | 'IDLE'
  | 'RUNNING'
  | 'PAUSED'
  | 'WAITING_VALIDATION'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LearningContextType {
  activeFlow: string | null;
  activeStepIndex: number;
  flowState: FlowState;
  uiState: UIState;
  completedActions: Record<string, boolean>;
  validationError: string | null;

  isChatOpen: boolean;
  toggleChat: () => void;

  // Acciones de control (única fuente de verdad)
  startFlow: (flowId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  finishFlow: () => void;
  pauseFlow: () => void;
  resumeFlow: () => void;
}

const initialUIState: UIState = {
  currentModule: 'client',
  currentScreen: 'campaigns',
  currentModal: null,
  currentWizardStep: null,
  formValues: {},
  taxSaved: false,
  whatsappConnected: false,
  onboardingWelcome: true,
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [flowState, setFlowState] = useState<FlowState>('IDLE');
  const [uiState, setUiState] = useState<UIState>(initialUIState);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pausedFlow, setPausedFlow] = useState<string | null>(null);

  // Validador de expectedState contra el UIState
  const validateStepState = useCallback((step: StepDef): { valid: boolean; error: string | null } => {
    if (!step.expectedState) return { valid: true, error: null };

    const { source, stateKey, operator, expectedValue, errorMessage } = step.expectedState;
    let actualValue: any = null;

    if (source === 'globalUI') {
      actualValue = (uiState as any)[stateKey];
    } else if (source === 'campaignWizard' || source === 'profileSettings') {
      actualValue = (uiState.formValues as any)[stateKey];
    }

    if (operator === 'notEmpty') {
      const isValid = actualValue !== undefined && actualValue !== null && actualValue.toString().trim().length > 0;
      return { valid: isValid, error: isValid ? null : errorMessage };
    }

    if (operator === 'greaterThan') {
      const numVal = parseFloat(actualValue);
      const limit = parseFloat(expectedValue);
      const isValid = !isNaN(numVal) && numVal > limit;
      return { valid: isValid, error: isValid ? null : errorMessage };
    }

    if (operator === 'equals') {
      const isValid = actualValue === expectedValue;
      return { valid: isValid, error: isValid ? null : errorMessage };
    }

    return { valid: true, error: null };
  }, [uiState]);

  // ContextDetector: Corrección de inicio unificada (solo Nivel 1 y Nivel 2, sin tocar el DOM)
  const detectStartStep = useCallback((flowId: string): number => {


    // Nivel 1: Determinar según UIState actual
    if (flowId === 'CREATE_CAMPAIGN') {
      if (uiState.currentModal === 'campaignWizard') {
        if (uiState.currentWizardStep === 4) return 13; // Pago
        if (uiState.currentWizardStep === 3) return 12; // Review
        if (uiState.currentWizardStep === 2) return 11; // AI Generando
        return 2; // Formulario
      }
      if (uiState.currentScreen === 'campaigns') {
        return 1; // Botón Nueva Campaña
      }
    }

    if (flowId === 'PAGOS') {
      const subIntent = sessionStorage.getItem('learning_sub_intent');
      if (subIntent === 'pdf') {
        if (uiState.currentScreen === 'pagos') {
          // Si ya está en la pantalla de pagos y preguntó por PDF, saltar directo al botón de descarga (Paso 8)
          sessionStorage.removeItem('learning_sub_intent'); // Consumir sub-intención
          return 8;
        }
        // Si está en otra parte, iniciar en Paso 0 (Ir a pagos)
        return 0;
      }

      if (uiState.currentModal === 'paymentModal') {
        // Si el modal de pago ya está abierto, saltar directo al primer campo del modal (Paso 3: Monto/Inputs)
        return 3;
      }
      if (uiState.currentScreen === 'pagos') {
        // Si ya está en la pantalla de pagos pero sin modal, iniciar en las tarjetas (Paso 1)
        return 1;
      }
    }

    if (flowId === 'MIS_PUBLICACIONES') {
      if (uiState.currentModal === 'newPublication') {
        // Modal de nueva publicación ya abierto, saltar directo al primer campo (Paso 4)
        return 4;
      }
      if (uiState.currentScreen === 'publicaciones') {
        // Ya está en la pantalla de publicaciones, saltar al paso del Historial (Paso 1)
        return 1;
      }
    }

    if (flowId === 'PROFILE_TOUR') {
      if (uiState.currentScreen === 'perfil') {
        return 1; // Razón Social
      }
    }

    return 0; // Inicio por defecto
  }, [uiState]);

  // Manejador del Dispatcher
  useEffect(() => {
    const unsubscribe = LearningDispatcher.subscribe((action: LearningAction) => {
      console.log(`[LearningDispatcher] Action: ${action.type}`, action.payload);

      switch (action.type) {
        case 'UPDATE_UI_STATE':
          setUiState(prev => {
            const nextState = {
              ...prev,
              ...action.payload,
              formValues: {
                ...prev.formValues,
                ...(action.payload.formValues || {}),
              }
            };

            // Redirección dinámica si el usuario venía buscando el PDF desde otra pantalla
            if (activeFlow === 'PAGOS' && nextState.currentScreen === 'pagos') {
              const subIntent = sessionStorage.getItem('learning_sub_intent');
              if (subIntent === 'pdf') {
                sessionStorage.removeItem('learning_sub_intent'); // Consumir
                setTimeout(() => setActiveStepIndex(8), 50); // Saltar al botón de descargas (Paso 8)
              }
            }

            return nextState;
          });
          break;
        case 'TRIGGER_ACTION':
          setCompletedActions(prev => ({ ...prev, [action.payload]: true }));
          break;
        case 'START_FLOW':
          setCompletedActions({});
          setValidationError(null);
          setIsChatOpen(false); // Ocultar el chat automáticamente al iniciar un tour
          const startIdx = detectStartStep(action.payload);
          setActiveStepIndex(startIdx);
          setActiveFlow(action.payload);
          setFlowState('RUNNING');
          break;
        case 'PAUSE_FLOW':
          setFlowState('PAUSED');
          break;
        case 'RESUME_FLOW':
          setFlowState('RUNNING');
          break;
        case 'FINISH_FLOW':
          setFlowState('COMPLETED');
          setActiveFlow(null);
          setActiveStepIndex(0);
          setCompletedActions({});
          setValidationError(null);
          break;
      }
    });

    return () => unsubscribe();
  }, [detectStartStep]);

  // Acciones de control de la Máquina de Estados
  const startFlow = useCallback((flowId: string) => {
    LearningDispatcher.dispatch('START_FLOW', flowId);
  }, []);

  const finishFlow = useCallback(() => {
    LearningDispatcher.dispatch('FINISH_FLOW');
  }, []);

  const pauseFlow = useCallback(() => {
    LearningDispatcher.dispatch('PAUSE_FLOW');
  }, []);

  const resumeFlow = useCallback(() => {
    LearningDispatcher.dispatch('RESUME_FLOW');
  }, []);

  const nextStep = useCallback(() => {
    if (!activeFlow) return;
    const steps = flowSteps[activeFlow] || [];
    const current = steps[activeStepIndex];

    if (current) {
      // Validaciones eliminadas a petición: el botón Siguiente siempre permite avanzar.
      // El avance automático por acciones sigue funcionando si el usuario interactúa.
    }
    
    setValidationError(null);
    setFlowState('RUNNING');

    const nextIdx = activeStepIndex + 1;
    if (nextIdx >= steps.length) {
      finishFlow();
    } else {
      setActiveStepIndex(nextIdx);
    }
  }, [activeFlow, activeStepIndex, validateStepState, finishFlow]);

  const prevStep = useCallback(() => {
    if (activeStepIndex > 0) {
      setValidationError(null);
      setFlowState('RUNNING');
      setActiveStepIndex(prev => prev - 1);
    }
  }, [activeStepIndex]);

  const toggleChat = useCallback(() => {
    if (!isChatOpen && activeFlow) {
      setPausedFlow(activeFlow);
      LearningDispatcher.dispatch('PAUSE_FLOW');
    } else if (isChatOpen && pausedFlow) {
      LearningDispatcher.dispatch('START_FLOW', pausedFlow);
      setPausedFlow(null);
    }
    setIsChatOpen(prev => !prev);
  }, [isChatOpen, activeFlow, pausedFlow]);

  // Auto-advance logic
  useEffect(() => {
    if (!activeFlow || (flowState !== 'RUNNING' && flowState !== 'WAITING_VALIDATION')) return;
    
    const steps = flowSteps[activeFlow] || [];
    const current = steps[activeStepIndex];
    if (!current) return;

    let shouldAdvance = false;

    // Si el paso requiere una acción específica (ej. clic en un botón) y se completó
    if (current.requiresAction && current.actionId && completedActions[current.actionId]) {
      shouldAdvance = true;
    } 
    // Si el paso esperaba un estado y ahora es válido (estando en WAITING_VALIDATION)
    else if (current.expectedState) {
      const { valid } = validateStepState(current);
      if (valid && flowState === 'WAITING_VALIDATION') {
        shouldAdvance = true;
      }
    }

    if (shouldAdvance) {
      if (current.actionId) {
        setCompletedActions(prev => ({ ...prev, [current.actionId!]: false }));
      }
      setValidationError(null);
      setFlowState('RUNNING');
      
      const nextIdx = activeStepIndex + 1;
      if (nextIdx >= steps.length) {
        finishFlow();
      } else {
        setActiveStepIndex(nextIdx);
      }
    }
  }, [activeFlow, activeStepIndex, flowState, completedActions, uiState, validateStepState, finishFlow]);

  // Event listener global para iniciar tours interactivos desde botones y el centro de aprendizaje
  useEffect(() => {
    const handleStartTour = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        startFlow(customEvent.detail);
      }
    };
    window.addEventListener('marketdev_start_tour', handleStartTour);
    return () => window.removeEventListener('marketdev_start_tour', handleStartTour);
  }, [startFlow]);

  return (
    <LearningContext.Provider value={{
      activeFlow,
      activeStepIndex,
      flowState,
      uiState,
      completedActions,
      validationError,
      isChatOpen,
      toggleChat,
      startFlow,
      nextStep,
      prevStep,
      finishFlow,
      pauseFlow,
      resumeFlow,
    }}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) throw new Error('useLearning debe usarse dentro de LearningProvider');
  return context;
};
