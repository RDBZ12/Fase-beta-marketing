// ─── Instagram Graph API — Analíticas Reales ──────────────────────────────────
// Usa el token de acceso de Instagram Graph API para obtener métricas reales
// de cada post publicado (likes, comentarios, alcance, guardados).
//
// Obtener el token en: https://developers.facebook.com/tools/explorer
// Permisos necesarios: instagram_basic, instagram_manage_insights, pages_read_engagement

const IG_TOKEN    = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN as string;
const IG_ACCT_ID  = import.meta.env.VITE_INSTAGRAM_ACCOUNT_ID  as string ?? '17841480091400531';
const GRAPH_BASE  = 'https://graph.facebook.com/v19.0';

export const hasInstagramToken = () =>
  Boolean(IG_TOKEN && IG_TOKEN !== 'PEGA_AQUI_TU_INSTAGRAM_ACCESS_TOKEN');

// ─── Analíticas reales de un post de Instagram ────────────────────────────────
// mediaId: el Instagram media ID (ej: 17892959541538893) del postIds del historial
export async function getInstagramPostInsights(mediaId: string): Promise<{
  likes: number;
  comentarios: number;
  compartidos: number;
  alcance: number;
  impresiones: number;
  guardados: number;
  source: 'instagram_real';
} | null> {
  if (!hasInstagramToken()) return null;

  try {
    // Métricas disponibles para posts de tipo FEED
    const metrics = 'impressions,reach,likes,comments,shares,saved,total_interactions';
    const url = `${GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${IG_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      console.warn('[Instagram API] Error:', data.error?.message ?? res.status);
      return null;
    }

    // Normalizar respuesta — Instagram devuelve array de objetos {name, values}
    const byName: Record<string, number> = {};
    (data.data ?? []).forEach((item: any) => {
      byName[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
    });

    return {
      likes:        byName.likes            ?? 0,
      comentarios:  byName.comments         ?? 0,
      compartidos:  byName.shares           ?? 0,
      alcance:      byName.reach            ?? byName.impressions ?? 0,
      impresiones:  byName.impressions      ?? 0,
      guardados:    byName.saved            ?? 0,
      source:       'instagram_real',
    };
  } catch (err) {
    console.warn('[Instagram API] Fetch error:', err);
    return null;
  }
}

// ─── Obtener todos los posts de la cuenta con sus métricas ────────────────────
export async function getInstagramMediaList(): Promise<Array<{
  id: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  media_type: string;
  like_count: number;
  comments_count: number;
}>> {
  if (!hasInstagramToken()) return [];

  const fields = 'id,caption,timestamp,permalink,media_type,like_count,comments_count';
  const url = `${GRAPH_BASE}/${IG_ACCT_ID}/media?fields=${fields}&access_token=${IG_TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    console.warn('[Instagram API] Media list error:', data.error?.message ?? res.status);
    return [];
  }

  return data.data ?? [];
}

// ─── Buscar post en Instagram por similitud de caption ────────────────────────
export async function findInstagramPostByContent(contenido: string): Promise<{
  id: string;
  likes: number;
  comentarios: number;
  permalink: string;
} | null> {
  const mediaList = await getInstagramMediaList();
  if (mediaList.length === 0) return null;

  const searchStr = contenido.toLowerCase().trim().substring(0, 40);

  const match = mediaList.find(m => {
    const caption = (m.caption ?? '').toLowerCase();
    return caption.includes(searchStr) || searchStr.includes(caption.substring(0, 30));
  });

  if (!match) return null;

  return {
    id:          match.id,
    likes:       match.like_count,
    comentarios: match.comments_count,
    permalink:   match.permalink,
  };
}
