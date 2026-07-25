# Guía de Despliegue - GCP Cloud Run

MarketIA v1.0 está empaquetado como un contenedor Docker multi-stage (Node + Nginx) optimizado para despliegues serverless.

## Requisitos Previos
*   Proyecto en Google Cloud Platform (GCP).
*   APIs habilitadas: Cloud Build API, Cloud Run API, Container Registry API.
*   Conexión de repositorio GitHub a Cloud Build.

## Estructura del Dockerfile
Se utiliza un `Dockerfile` en la raíz del proyecto que realiza dos pasos:
1.  **Build:** Imagen de `node:20-alpine` para ejecutar `npm install` y `npm run build`.
2.  **Serve:** Imagen de `nginx:alpine` copiando el contenido de `dist/` a la ruta pública, y configurando `nginx.conf` para el routing de una SPA (Single Page Application).

## Variables de Entorno (Producción)
Las siguientes variables de entorno deben configurarse en Cloud Run (Secrets Manager recomendado):
*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`
*(Nota: `GEMINI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` deben estar configuradas exclusivamente en el Dashboard de Supabase, sección Edge Functions, NO en el frontend).*

## Pasos para el Despliegue Continuo (CI/CD)
El archivo `cloudbuild.yaml` define el pipeline de GCP:
1.  **Construcción de Imagen:** `docker build` de la aplicación.
2.  **Subida (Push):** Envío de la imagen al Google Container Registry (GCR) o Artifact Registry.
3.  **Despliegue:** Invocación de `gcloud run deploy` exponiendo el puerto 80 (Nginx) y permitiendo acceso no autenticado a internet.
