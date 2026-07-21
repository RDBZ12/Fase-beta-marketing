/**
 * Módulo para interactuar con la Instagram Graph API.
 * Proporciona métodos para obtener métricas (Insights) y contenido (Media).
 */

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.instagram.com/${API_VERSION}`;

/**
 * Función genérica para manejar peticiones a la API de Meta.
 */
async function fetchMetaApi(endpoint: string, params: Record<string, string>, token: string) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('access_token', token);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || response.statusText || 'Error desconocido en la API de Meta';
    const errorCode = data.error?.code;
    
    if (errorCode === 190) {
      console.error('Token expirado o inválido. Por favor renueva tu INSTAGRAM_ACCESS_TOKEN.');
    }
    
    throw new Error(`Meta API Error (${errorCode || response.status}): ${errorMsg}`);
  }

  return data;
}

/**
 * Obtiene métricas generales del perfil de Instagram Business.
 */
export async function getProfileInsights(accountId: string, token: string) {
  try {
    const data = await fetchMetaApi(`/${accountId}/insights`, {
      metric: 'reach,profile_views,follower_count',
      period: 'day'
    }, token);
    
    return data.data; // Retorna un array con las métricas
  } catch (error) {
    console.error('Error obteniendo insights del perfil:', error);
    throw error;
  }
}

/**
 * Obtiene las publicaciones recientes del feed (Media) con sus métricas básicas (Likes y Comentarios).
 */
export async function getRecentMedia(accountId: string, token: string, limit: number = 10) {
  try {
    const data = await fetchMetaApi(`/${accountId}/media`, {
      fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count',
      limit: limit.toString()
    }, token);
    
    return data.data; // Array de objetos media
  } catch (error) {
    console.error('Error obteniendo publicaciones recientes:', error);
    throw error;
  }
}

/**
 * Obtiene métricas avanzadas (Insights) de una publicación específica.
 */
export async function getMediaInsights(mediaId: string, token: string) {
  try {
    const data = await fetchMetaApi(`/${mediaId}/insights`, {
      metric: 'shares,reach,saved'
    }, token);
    
    return data.data;
  } catch (error) {
    console.error(`Error obteniendo insights para el media ${mediaId}:`, error);
    throw error;
  }
}
