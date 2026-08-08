import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, imageUrl, text } = req.body;

    const apiKey = process.env.KAPSO_API_KEY || process.env.VITE_KAPSO_API_KEY;
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID || process.env.VITE_KAPSO_PHONE_NUMBER_ID;

    if (!apiKey || !phoneNumberId) {
      return res.status(500).json({ error: 'Faltan las credenciales de Kapso en el servidor' });
    }

    const cleanTo = to.split('@')[0].replace(/[^0-9]/g, '');

    const whatsapp = new WhatsAppClient({
      baseUrl: "https://api.kapso.ai/meta/whatsapp",
      kapsoApiKey: apiKey
    });

    if (imageUrl) {
      // Usar un proxy gratuito (Images.weserv.nl) para convertir CUALQUIER imagen (webp, png, etc) a JPEG en tiempo real.
      // Esto soluciona de raíz el problema de Meta Cloud API rechazando imágenes WebP.
      const convertedImageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg`;
      
      const imageResponse = await fetch(convertedImageUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({ error: "No se pudo procesar y descargar la imagen desde la URL proporcionada" });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      
      let fileName = imageUrl.split('/').pop()?.split('?')[0] || 'imagen';
      if (fileName.includes('.')) {
        fileName = fileName.substring(0, fileName.lastIndexOf('.'));
      }
      fileName += '.jpg';

      // 2. Subimos el Blob a Kapso como media temporal
      const uploaded = await whatsapp.media.upload({
        phoneNumberId: phoneNumberId,
        type: "image",
        file: imageBlob,
        fileName: fileName
      });

      // 3. Enviamos el mensaje usando el media_id subido
      const result = await whatsapp.messages.sendImage({
        phoneNumberId: phoneNumberId,
        to: cleanTo,
        image: {
          id: uploaded.id,
          caption: text || ''
        }
      });

      return res.status(200).json(result);
    } else {
      // Mensaje de texto normal si no hay imagen
      const result = await whatsapp.messages.sendText({
        phoneNumberId: phoneNumberId,
        to: cleanTo,
        body: text || ''
      });
      
      return res.status(200).json(result);
    }
  } catch (error: any) {
    console.error('Error en /api/compartir-whatsapp:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
