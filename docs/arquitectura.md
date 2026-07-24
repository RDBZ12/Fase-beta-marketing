# Arquitectura del Sistema - MarketIA v1.0

## Visión General
MarketIA es una plataforma integral de marketing automatizado construida sobre React (Vite) en el frontend y Supabase en el backend, con integraciones de IA generativa (Gemini).

## Stack Tecnológico
*   **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Lucide React.
*   **Estado:** Context API (`LearningContext`, `AuthContext`).
*   **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Edge Functions).
*   **IA:** Google Gemini 1.5/2.5 Flash.
*   **Despliegue:** Cloud Build + Cloud Run (GCP).

## Estructura de Directorios
*   `/src/components/`: Componentes modulares UI.
*   `/src/learning/`: Motor del Sistema de Aprendizaje (totalmente desacoplado).
*   `/supabase/`: Esquemas de base de datos y Edge Functions.
*   `/docs/`: Documentación técnica.

## Patrones de Diseño
1.  **Componentes Desacoplados:** El Sistema de Aprendizaje se inyecta globalmente y observa el DOM, evitando enredar la lógica de negocio.
2.  **API Proxy (Edge Functions):** Para proteger secretos como `GEMINI_API_KEY`, las llamadas a IA se realizan desde el backend de Supabase.
3.  **Seguridad de Datos:** Row Level Security (RLS) garantiza que los usuarios solo vean sus propias campañas y progresos.
