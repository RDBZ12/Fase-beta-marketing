// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action = 'publish', post, platforms, mediaUrls, scheduleDate } = body

    const AYRSHARE_API_KEY = Deno.env.get('AYRSHARE_API_KEY')

    if (action === 'analytics_links') {
      if (!AYRSHARE_API_KEY) {
        return new Response(JSON.stringify({ status: 'error', message: 'No API KEY' }), { status: 400 });
      }
      const response = await fetch("https://api.ayrshare.com/api/links", {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AYRSHARE_API_KEY}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al obtener analytics');
      return new Response(JSON.stringify({ status: 'success', analytics: data.analytics || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'sync') {
      if (!AYRSHARE_API_KEY) {
        return new Response(JSON.stringify({ status: 'success', mock: true, history: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }
      const response = await fetch("https://api.ayrshare.com/api/history", {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AYRSHARE_API_KEY}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error api Ayrshare (History)');
      return new Response(JSON.stringify({ status: 'success', history: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // ========== NATIVE META API PARA INSTAGRAM ==========
    // Usamos Meta API directamente (Ayrshare no está configurado correctamente para perfiles de usuario)
    if (platforms && (platforms.includes('instagram') || platforms.includes('Instagram'))) {
      const META_IG_TOKEN = Deno.env.get('META_IG_TOKEN') || "IGAAScneSSel5BZAGEwYy1XWU0tQlpZANWtvbVQ5emFPbjg5bklMekNLQ3M5TTdSZATdkSG4xUkV3dDJvZAGs5RDVaaDByNzQ2QnBoTjNfcFdTbUVtQzlvcVpsaGphYnJWaGtYeUY3c2p6WXFmNlFLRk1RREV0b0FNWk91S0tyODNndwZDZD";
      
      console.log("Usando la API oficial de Meta para Instagram...");
      
      const meRes = await fetch(`https://graph.instagram.com/v21.0/me?access_token=${META_IG_TOKEN}`);
      const meData = await meRes.json();
      if (!meData.id) {
        throw new Error("Token de Meta inválido o expirado: " + JSON.stringify(meData));
      }
      const igUserId = meData.id;

      if (!mediaUrls || mediaUrls.length === 0) {
        throw new Error("Se requiere al menos una imagen (mediaUrl) para publicar en Instagram.");
      }

      let safeMediaUrl = mediaUrls[0];
      if (safeMediaUrl.includes('pollinations.ai') && !safeMediaUrl.includes('.jpg')) {
        const parts = safeMediaUrl.split('?');
        safeMediaUrl = parts[0] + '.jpg' + (parts[1] ? '?' + parts[1] : '');
      }

      const isVideo = safeMediaUrl.toLowerCase().match(/\.(mp4|mov)(\?.*)?$/) != null;
      const containerBody: any = {
        caption: post,
        access_token: META_IG_TOKEN
      };
      if (isVideo) {
        containerBody.media_type = 'VIDEO';
        containerBody.video_url = safeMediaUrl;
      } else {
        containerBody.image_url = safeMediaUrl;
      }

      const createContainerUrl = `https://graph.instagram.com/v21.0/${igUserId}/media`;
      const containerRes = await fetch(createContainerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerBody)
      });
      const containerData = await containerRes.json();
      
      if (!containerData.id) {
        throw new Error("Error creando contenedor en Meta: " + (containerData.error?.message || JSON.stringify(containerData)));
      }

      let mediaStatus = "IN_PROGRESS";
      let retries = 0;
      while (mediaStatus !== "FINISHED" && retries < 5) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`https://graph.instagram.com/v21.0/${containerData.id}?fields=status_code&access_token=${META_IG_TOKEN}`);
        const statusData = await statusRes.json();
        if (statusData.status_code) mediaStatus = statusData.status_code;
        if (mediaStatus === "ERROR") throw new Error("Meta falló al procesar la imagen.");
        retries++;
      }

      const publishUrl = `https://graph.instagram.com/v21.0/${igUserId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: containerData.id, access_token: META_IG_TOKEN })
      });
      const publishData = await publishRes.json();
      
      if (!publishData.id) {
        throw new Error("Error publicando en Meta: " + (publishData.error?.message || JSON.stringify(publishData)));
      }

      console.log("Publicación en Meta exitosa:", publishData);
      return new Response(JSON.stringify({ status: 'success', data: { id: publishData.id, message: "Publicado vía Meta API" } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    // ====================================================

    if (!AYRSHARE_API_KEY) {
      return new Response(JSON.stringify({ status: 'success', message: 'Simulado', mock: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
    
    const ayrshareBody: any = { post, platforms, mediaUrls, shortenLinks: true };
    if (scheduleDate) ayrshareBody.scheduleDate = scheduleDate;

    const response = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AYRSHARE_API_KEY}` },
      body: JSON.stringify(ayrshareBody),
    });

    let data;
    try { data = await response.json(); } catch (_err) { throw new Error(`HTTP ${response.status}`); }
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    return new Response(JSON.stringify({ status: 'success', data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
})
