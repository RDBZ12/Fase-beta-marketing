# Sistema de Aprendizaje Autónomo

El Sistema de Aprendizaje de MarketIA no es un simple tutorial lineal, es un motor reactivo que comprende el contexto del usuario.

## Componentes Principales

1.  **Module Registry (`moduleRegistry.ts`)**
    *   La única fuente de verdad.
    *   Define los Módulos, Flujos (Flows), Pasos (Steps), Intenciones (Intents) y Preguntas Frecuentes (FAQs).

2.  **Learning Context (`LearningContext.tsx`)**
    *   Gestiona el estado global (flujo activo, paso actual, pausas).
    *   Persiste el progreso en la base de datos (Supabase `learning_progress`), permitiendo experiencias multidispositivo.

3.  **Learning Tour (`LearningTour.tsx`)**
    *   Implementa `react-joyride` para guiar al usuario visualmente.
    *   Maneja eventos de manera resiliente (ej. saltar un paso si un target no está en el DOM).

4.  **Learning Instructor (`LearningInstructor.tsx`)**
    *   Interfaz tipo chat flotante. Combina respuestas predefinidas locales con IA Generativa para brindar asistencia inteligente.
