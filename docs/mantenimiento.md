# Guía de Mantenimiento

Para asegurar la estabilidad a largo plazo del Sistema de Aprendizaje y de MarketIA, deben seguirse las siguientes prácticas:

## Mantenimiento del Sistema de Aprendizaje
1.  **Nuevas Pantallas o Funcionalidades:** Siempre que se añada un módulo nuevo, se DEBE registrar en `src/learning/data/moduleRegistry.ts`.
2.  **Identificadores del DOM:** Si los componentes de React cambian sus layouts, revisar que los `id="tour-..."` permanezcan estables.
3.  **Depuración Rápida:** Para depurar el estado del sistema, verificar la tabla `learning_progress` en Supabase o examinar el `LearningContext` usando React DevTools.

## Mantenimiento de Edge Functions
Para desplegar actualizaciones a las funciones de IA:
1.  Usar la CLI de Supabase: `npx supabase functions deploy instructor-ai --project-ref [PROYECTO_ID]`.
2.  Asegurarse de no exponer secrets (ej. `GEMINI_API_KEY`) en el código. Administrarlos desde `npx supabase secrets set`.

## Dependencias
*   Mantener actualizados `react-joyride` y `@supabase/supabase-js`.
*   Monitorear la versión de la API de Gemini (`gemini-2.5-flash`), ya que Google podría requerir actualizaciones de endpoint en el futuro.
