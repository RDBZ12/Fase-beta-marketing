// ─── Cliente directo de Ayrshare API ──────────────────────────────────────────
// Usa la API Key de Ayrshare para obtener el historial de posts publicados.
//
// PLAN FREE:  /api/history            → disponible (posts publicados + URLs)
// PLAN FREE:  /api/analytics/*        → BLOQUEADO (requiere Premium)
// PLAN PREMIUM: /api/analytics/post   → likes, comentarios, alcance, impresiones
//
// Si los datos no están disponibles se devuelve null — NUNCA se inventan valores.

const AYRSHARE_API_KEY = import.meta.env.VITE_AYRSHARE_API_KEY as string;
const BASE_URL = 'https://api.ayrshare.com/api';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
});

export const hasAyrshareKey = () =>
  Boolean(AYRSHARE_API_KEY && AYRSHARE_API_KEY !== 'PEGA_AQUI_TU_AYRSHARE_API_KEY');

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface AyrsharePost {
  id: string;
  post: string;
  created: string;
  status: string;
  platforms: string[];
  mediaUrls?: string[];
  postIds?: Array<{
    platform: string;
    id: string;
    postUrl: string;
    status: string;
  }>;
}

export interface RealAnalytics {
  likes: number | null;
  comentarios: number | null;
  compartidos: number | null;
  alcance: number | null;
  impresiones: number | null;
  guardados: number | null;
  source: 'ayrshare_real';
  postUrl?: string;
}

// ─── Historial de posts (Plan Free) ───────────────────────────────────────────
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

  const pText   = contenido.toLowerCase().trim();
  const minLen  = Math.min(30, pText.length);
  const searchStr = pText.substring(0, minLen);

  return history.find((h) => {
    const hText = (h.post || '').toLowerCase().replace('[sent with free plan] ', '');
    return hText.includes(searchStr) || searchStr.includes(hText.substring(0, minLen));
  }) ?? null;
}

// ─── Analíticas reales de un post (requiere Plan Premium) ─────────────────────
// Devuelve null si el plan no lo permite — NUNCA devuelve datos inventados.
export async function getPostAnalytics(ayrsharePostId: string): Promise<RealAnalytics | null> {
  if (!hasAyrshareKey()) return null;

  try {
    const res = await fetch(`${BASE_URL}/analytics/post`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ id: ayrsharePostId }),
    });

    const data = await res.json();

    // code 169 = "Paid Plan Required" — no hay datos, devolver null honestamente
    if (!res.ok || data.code === 169 || data.status === 'error') {
      return null;
    }

    // Normalizar analíticas de múltiples plataformas
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
    let likes = 0, comentarios = 0, compartidos = 0, alcance = 0, impresiones = 0, guardados = 0;
    let hasAny = false;

    platforms.forEach(plat => {
      const platData = data[plat];
      if (!platData) return;
      const a = platData.analytics ?? platData;
      likes       += Number(a.likeCount       || a.likes         || a.reactions    || a.favoriteCount || 0);
      comentarios += Number(a.commentCount     || a.comments      || a.commentsCount || 0);
      compartidos += Number(a.shareCount       || a.shares        || a.retweetCount  || a.repostCount  || 0);
      alcance     += Number(a.reach            || a.reachCount    || 0);
      impresiones += Number(a.impressionCount  || a.impressions   || a.viewCount     || a.views        || 0);
      guardados   += Number(a.savedCount       || a.saved         || 0);
      hasAny = true;
    });

    if (!hasAny) return null;

    return { likes, comentarios, compartidos, alcance, impresiones, guardados, source: 'ayrshare_real' };
  } catch {
    return null;
  }
}

// ─── Buscar analíticas por contenido (sin tener el ayrshare_post_id) ──────────
export async function getAnalyticsByContent(contenido: string): Promise<RealAnalytics | null> {
  const post = await findPostInHistory(contenido);
  if (!post) return null;

  const analytics = await getPostAnalytics(post.id);
  const postUrl   = post.postIds?.[0]?.postUrl;

  if (!analytics) {
    // Si no hay analytics (plan Free), al menos devolvemos la URL del post
    if (postUrl) return { likes: null, comentarios: null, compartidos: null, alcance: null, impresiones: null, guardados: null, source: 'ayrshare_real', postUrl };
    return null;
  }

  return { ...analytics, postUrl };
}
