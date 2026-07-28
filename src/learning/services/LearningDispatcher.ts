// src/learning/services/LearningDispatcher.ts
// Despachador de acciones unificado para el Motor de Aprendizaje - Marketdev

export type LearningActionType =
  | 'UPDATE_UI_STATE'
  | 'TRIGGER_ACTION'
  | 'START_FLOW'
  | 'PAUSE_FLOW'
  | 'RESUME_FLOW'
  | 'FINISH_FLOW';

export interface LearningAction {
  type: LearningActionType;
  payload?: any;
}

type LearningListener = (action: LearningAction) => void;

export class LearningDispatcher {
  private static listeners: LearningListener[] = [];

  static subscribe(listener: LearningListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static dispatch(type: LearningActionType, payload?: any) {
    const action: LearningAction = { type, payload };
    this.listeners.forEach(l => l(action));
  }
}
