# Instructor IA

El Instructor IA es un asistente híbrido diseñado para ayudar a usuarios sin experiencia a dominar MarketIA de forma autónoma.

## Arquitectura de 2 Capas (Layers)

### Layer 1: Respuestas Locales (Pattern Matching)
Antes de invocar una API costosa, el Instructor busca coincidencias exactas en el `moduleRegistry.ts`:
*   **Contexto Inmediato:** Si el usuario pregunta "¿Qué hago?" y un tour está pausado, la respuesta prioriza sugerir la reanudación del tour.
*   **Intents:** Analiza palabras clave (ej. "factura", "ncf") y devuelve una respuesta estructurada o inicia un tour específico sin delay.
*   **FAQs:** Preguntas directas son respondidas al instante.

### Layer 2: Gemini vía Edge Function
Si la petición del usuario no tiene una correspondencia local, se recurre a la inteligencia artificial generativa:
1.  **Construcción de Contexto:** El frontend envía el estado actual (módulo activo, tours completados) al backend.
2.  **Edge Function (`instructor-ai`):** Un microservicio en Deno recibe la petición y construye un Prompt de Sistema estricto.
3.  **Respuesta JSON:** Gemini devuelve la sugerencia de texto y, opcionalmente, una acción estructurada (ej. `targetId: "FLOW_CAMPAIGN_WIZARD"`) para ejecutar en la UI.
4.  **Seguridad:** La `GEMINI_API_KEY` se mantiene oculta en el backend de Supabase.
