export interface KapsoMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: { body: string };
}

/**
 * Servicio para enviar mensajes de WhatsApp vía Kapso.ai
 * Reemplaza la funcionalidad de OpenWA.
 */
export async function sendKapsoMessage(to: string, message: string) {
  // En frontend (Vite) usamos import.meta.env, en el backend de Vercel process.env.
  // Permitimos ambos para compatibilidad.
  const apiKey = (typeof process !== 'undefined' ? process.env.KAPSO_API_KEY : import.meta.env.VITE_KAPSO_API_KEY) || import.meta.env.VITE_KAPSO_API_KEY;
  const phoneNumberId = (typeof process !== 'undefined' ? process.env.KAPSO_PHONE_NUMBER_ID : import.meta.env.VITE_KAPSO_PHONE_NUMBER_ID) || import.meta.env.VITE_KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error('Faltan las credenciales de Kapso (API_KEY o PHONE_NUMBER_ID) en las variables de entorno.');
  }

  const endpoint = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`;

  const cleanTo = to.split('@')[0].replace(/[^0-9]/g, '');

  const payload: KapsoMessagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: { body: message }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new Error(`Kapso API Error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error enviando mensaje por Kapso:', error);
    throw error;
  }
}

/**
 * Servicio para enviar imágenes de WhatsApp vía Kapso.ai
 * Reemplaza a sendWhatsAppImageMessage de OpenWA.
 */
export async function sendKapsoImageMessage(to: string, imageUrl: string, caption?: string) {
  const apiKey = (typeof process !== 'undefined' ? process.env.KAPSO_API_KEY : import.meta.env.VITE_KAPSO_API_KEY) || import.meta.env.VITE_KAPSO_API_KEY;
  const phoneNumberId = (typeof process !== 'undefined' ? process.env.KAPSO_PHONE_NUMBER_ID : import.meta.env.VITE_KAPSO_PHONE_NUMBER_ID) || import.meta.env.VITE_KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error('Faltan las credenciales de Kapso (API_KEY o PHONE_NUMBER_ID) en las variables de entorno.');
  }

  // Meta Cloud API no acepta base64 puro en los mensajes de salida, necesita una URL pública o un ID de media pre-subido.
  // Aquí usamos la estructura de "link" para URLs públicas.
  if (imageUrl.startsWith('data:')) {
    throw new Error('Kapso requiere una URL de imagen pública, no puede enviar base64 directamente. Por favor sube la imagen primero.');
  }

  const endpoint = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`;

  const cleanTo = to.split('@')[0].replace(/[^0-9]/g, '');

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'image',
    image: {
      link: imageUrl
    }
  };

  if (caption) {
    payload.image.caption = caption;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new Error(`Kapso API Error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error enviando imagen por Kapso:', error);
    throw error;
  }
}

