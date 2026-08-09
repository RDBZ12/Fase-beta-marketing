/**
 * Módulo para interactuar con la Instagram Graph API.
 * Proporciona métodos para obtener métricas (Insights) y contenido (Media).
 */

export async function getRecentMedia(limit: number = 10) {
  try {
    const res = await fetch('/api/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'media', limit })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[IG Media] HTTP Error:', res.status, data);
    }
    if (data.error) {
      console.error('[IG Media] Meta API Error:', data.error);
    }
    return data.data || [];
  } catch (error) {
    console.error('Error obteniendo publicaciones recientes:', error);
    return [];
  }
}

export async function getMediaInsights(mediaId: string) {
  try {
    const res = await fetch('/api/instagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'insights', mediaId })
    });
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error obteniendo insights para el media ${mediaId}:`, error);
    return [];
  }
}
