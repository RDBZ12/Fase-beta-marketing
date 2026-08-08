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
      // 1. Descargamos la imagen de la URL que mandó el frontend
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({ error: "No se pudo descargar la imagen desde la URL proporcionada" });
      }
      
      const contentType = imageResponse.headers.get('content-type');
      
      // Meta solo permite jpeg y png para imágenes (WebP es solo para stickers)
      if (!contentType || !["image/jpeg", "image/png"].includes(contentType)) {
        return res.status(400).json({ 
          error: `Formato de imagen no soportado por WhatsApp: ${contentType}. Sube una imagen JPG o PNG.`,
          details: "WhatsApp requiere estrictamente image/jpeg o image/png."
        });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBlob = new Blob([imageBuffer], { type: contentType });
      
      let extension = contentType === 'image/png' ? '.png' : '.jpg';
      let fileName = imageUrl.split('/').pop()?.split('?')[0] || `imagen${extension}`;
      if (!fileName.includes('.')) {
        fileName += extension;
      }

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
        text: {
          body: text || ''
        }
      });
      
      return res.status(200).json(result);
    }
  } catch (error: any) {
    console.error('Error en /api/compartir-whatsapp:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
