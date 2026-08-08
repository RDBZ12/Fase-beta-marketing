import { logSystemEvent } from './logger';

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
  try {
    const response = await fetch('/api/compartir-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        text: message
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new Error(`Error del servidor (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error enviando mensaje de texto vía backend:', error);
    logSystemEvent('ERROR', 'WhatsApp API (Texto)', error.message, { to });
    throw error;
  }
}

/**
 * Servicio para enviar imágenes de WhatsApp vía Kapso.ai
 * Reemplaza a sendWhatsAppImageMessage de OpenWA.
 */
export async function sendKapsoImageMessage(to: string, imageUrl: string, caption?: string) {
  if (imageUrl.startsWith('data:')) {
    throw new Error('Se requiere una URL de imagen pública, no puede enviar base64 directamente. Por favor sube la imagen primero.');
  }

  try {
    const response = await fetch('/api/compartir-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        imageUrl,
        text: caption
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new Error(`Error del servidor (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error enviando imagen vía backend:', error);
    logSystemEvent('ERROR', 'WhatsApp API (Imagen)', error.message, { to, imageUrl });
    throw error;
  }
}

