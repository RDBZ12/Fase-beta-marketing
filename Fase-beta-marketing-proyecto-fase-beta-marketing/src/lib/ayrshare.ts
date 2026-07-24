// ─── Cliente directo de Ayrshare API ──────────────────────────────────────────
// Usa la API Key de Ayrshare para obtener el historial de posts publicados.
// NOTA: Las analíticas por post (likes, comentarios, alcance) requieren plan
// Premium de Ayrshare. Con el plan Free, se obtiene el historial de posts
// y sus URLs en Instagram, pero NO las métricas de engagement.
// Ver: https://docs.ayrshare.com

const AYRSHARE_API_KEY = import.meta.env.VITE_AYRSHARE_API_KEY as string;
const BASE_URL = 'https://api.ayrshare.com/api';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
});

export const hasAyrshareKey = () =>
  Boolean(AYRSHARE_API_KEY && AYRSHARE_API_KEY !== 'FEC64958-E887449B-B80BB8CC-96537107');

// ─── Historial de posts publicados via Ayrshare ────────────────────────────────
// Disponible en plan Free. Devuelve los posts publicados con sus IDs de plataforma.
export interface AyrsharePost {
  id: string;           // ID interno de Ayrshare
  post: string;         // Texto del post
  created: string;      // Fecha de creación
  status: string;       // 'success' | 'error'
  platforms: string[];
  mediaUrls?: string[];
  postIds?: Array<{
    platform: string;
    id: string;         // ID del post en la red social (ej: Instagram media ID)
    postUrl: string;    // URL directa al post en Instagram/Facebook/etc.
    status: string;
  }>;
}

export async function getPostHistory(): Promise<AyrsharePost[]> {
  if (!hasAyrshareKey()) return [];

  const res = await fetch(`${BASE_URL}/history?offset=0&limit=100`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error Ayrshare history: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : (data.history ?? []);
}

// ─── Buscar post en historial por similitud de texto ──────────────────────────
export async function findPostInHistory(contenido: string): Promise<AyrsharePost | null> {
  const history = await getPostHistory();
  if (history.length === 0) return null;

  // Limpiar el texto del contenido para comparación
  const pText = contenido.toLowerCase().trim();
  const minLen = Math.min(30, pText.length);
  const searchStr = pText.substring(0, minLen);

  return history.find((h) => {
    // Ayrshare agrega "[Sent with Free Plan] " al inicio del post
    const hText = (h.post || '').toLowerCase().replace('[sent with free plan] ', '');
    return hText.includes(searchStr) || searchStr.includes(hText.substring(0, minLen));
  }) ?? null;
}

// ─── Obtener analíticas de un post ────────────────────────────────────────────
// Con plan Free: solo retorna datos simulados o del historial (sin métricas reales).
// Con plan Premium/Business: consulta el endpoint /api/analytics/post.
export async function getPostAnalytics(ayrsharePostId: string): Promise<{
  likes: number;
  comentarios: number;
  compartidos: number;
  alcance: number;
  source: 'real' | 'simulated';
}> {
  if (!hasAyrshareKey()) {
    return simulateMetrics('no-key');
  }

  try {
    // Intentar endpoint de analíticas (requiere plan Premium)
    const res = await fetch(`${BASE_URL}/analytics/post`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ id: ayrsharePostId }),
    });

    const data = await res.json();

    if (!res.ok || data.code === 169) {
      // Plan Free — no disponible. Fallback a simulación.
      return simulateMetrics('free-plan');
    }

    // Normalizar analíticas de múltiples plataformas
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
    let likes = 0, comentarios = 0, compartidos = 0, alcance = 0;

    platforms.forEach(plat => {
      const platData = data[plat];
      if (!platData) return;
      const a = platData.analytics ?? platData;
      likes += Number(a.likeCount || a.likes || a.reactions || a.favoriteCount || 0);
      comentarios += Number(a.commentCount || a.comments || a.commentsCount || 0);
      compartidos += Number(a.shareCount || a.shares || a.retweetCount || a.repostCount || 0);
      alcance += Number(a.impressionCount || a.impressions || a.views || a.reach || a.viewCount || 0);
    });

    return { likes, comentarios, compartidos, alcance, source: 'real' };
  } catch {
    return simulateMetrics('error');
  }
}

// ─── Buscar y obtener analíticas por contenido ────────────────────────────────
export async function getAnalyticsByContent(contenido: string): Promise<{
  likes: number;
  comentarios: number;
  compartidos: number;
  alcance: number;
  source: 'real' | 'simulated';
  postUrl?: string;
} | null> {
  const post = await findPostInHistory(contenido);
  if (!post) return null;

  // Intentar conseguir analíticas reales del post
  const analytics = await getPostAnalytics(post.id);

  // Adjuntar URL directa al post si está disponible
  const postUrl = post.postIds?.[0]?.postUrl;

  return { ...analytics, postUrl };
}

// ─── Simulación de métricas ────────────────────────────────────────────────────
function simulateMetrics(_reason: string) {
  return {
    likes: Math.floor(Math.random() * 80) + 15,
    comentarios: Math.floor(Math.random() * 20) + 5,
    compartidos: Math.floor(Math.random() * 10) + 2,
    alcance: Math.floor(Math.random() * 300) + 100,
    source: 'simulated' as const,
  };
}
