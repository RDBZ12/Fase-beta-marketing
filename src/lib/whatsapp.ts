// ─── Cliente de API de WhatsApp (OpenWA Gateway) ──────────────────────────────
// Se comunica con el servidor de OpenWA para verificar la sesión y enviar mensajes.
// Documentación de referencia: http://localhost:2785/api/docs

export interface OpenWASession {
  id: string;
  name: string;
  status: 'created' | 'initializing' | 'qr_ready' | 'authenticating' | 'ready' | 'disconnected' | 'failed';
  phone?: string;
  pushName?: string;
  connectedAt?: string;
  lastActive?: string;
}

// Obtiene la configuración de OpenWA (prioriza localStorage, luego usa variables de entorno)
export function getOpenWASettings() {
  let localUrl: string | null = null;
  let localKey: string | null = null;
  let localSession = 'marketing-bot';

  try {
    localUrl = localStorage.getItem('openwa_api_url');
    localKey = localStorage.getItem('openwa_api_key');
    localSession = localStorage.getItem('openwa_session_name') || 'marketing-bot';
  } catch (e) {
    console.warn('localStorage is not available for OpenWA settings');
  }

  let apiUrl = localUrl || import.meta.env.VITE_OPENWA_API_URL || 'http://localhost:2785/api';

  // CORS Bypass genérico: Si intenta conectar a cualquier puerto localhost, usar proxy
  if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    apiUrl = '/proxy-openwa/api';
  }

  return {
    apiUrl,
    apiKey: localKey || import.meta.env.VITE_OPENWA_API_KEY || 'owa_k1_98f0a84c3b21bd0ec89b7b8d78a2182a90dc355b4d0ef5aab13b9ad3a1c931a3',
    sessionName: localSession,
  };
}

export function saveOpenWASettings(url: string, key: string, sessionName: string) {
  try {
    localStorage.setItem('openwa_api_url', url.trim());
    localStorage.setItem('openwa_api_key', key.trim());
    localStorage.setItem('openwa_session_name', sessionName.trim());
  } catch (e) {
    console.warn('localStorage is not available to save OpenWA settings');
  }
}

// Helper para cabeceras
function getHeaders(apiKey: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  return headers;
}

// Helper para capturar errores de proxy/servidor apagado
async function handleOpenWAError(res: Response) {
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    const errorMsg = "El servidor de WhatsApp (OpenWA) está apagado o no responde.";
    throw new Error(errorMsg);
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || `Error HTTP: ${res.status}`);
}

// 1. Obtener todas las sesiones
export async function getOpenWASessions(): Promise<OpenWASession[]> {
  const { apiUrl, apiKey } = getOpenWASettings();
  try {
    const res = await fetch(`${apiUrl}/sessions`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return []; // Retornar vacío de forma pacífica si está apagado
      }
      await handleOpenWAError(res);
    }
    return await res.json();
  } catch (error: any) {
    return []; // Retornar vacío si no hay conexión en absoluto
  }
}

// 2. Crear una nueva sesión
export async function createOpenWASession(name: string): Promise<OpenWASession> {
  const { apiUrl, apiKey } = getOpenWASettings();
  try {
    const res = await fetch(`${apiUrl}/sessions`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      await handleOpenWAError(res);
    }
    return await res.json();
  } catch (error: any) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// 3. Iniciar una sesión existente
export async function startOpenWASession(id: string): Promise<OpenWASession> {
  const { apiUrl, apiKey } = getOpenWASettings();
  try {
    const res = await fetch(`${apiUrl}/sessions/${id}/start`, {
      method: 'POST',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) {
      await handleOpenWAError(res);
    }
    return await res.json();
  } catch (error: any) {
    console.error('Error starting session:', error);
    throw error;
  }
}

// 4. Detener sesión
export async function stopOpenWASession(id: string): Promise<OpenWASession> {
  const { apiUrl, apiKey } = getOpenWASettings();
  try {
    const res = await fetch(`${apiUrl}/sessions/${id}/stop`, {
      method: 'POST',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) {
      await handleOpenWAError(res);
    }
    return await res.json();
  } catch (error: any) {
    console.error('Error stopping session:', error);
    throw error;
  }
}

export interface OpenWAGroup {
  id: string;
  name: string;
  participantsCount?: number;
}

export interface OpenWAContact {
  id: string;
  name?: string;
  pushName?: string;
  number: string;
}

// Cache global para evitar llamadas concurrentes a ensureSessionReady
const sessionReadyPromises = new Map<string, Promise<OpenWASession>>();

/**
 * Encuentra la sesión por nombre y, si está desconectada/fallida, la inicia
 * automáticamente. Espera hasta ~20 segundos a que esté "ready".
 * Lanza un error si no puede llegar al estado ready.
 */
export async function ensureSessionReady(sessionNameOverride?: string): Promise<OpenWASession> {
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;

  if (sessionReadyPromises.has(sessionName)) {
    return sessionReadyPromises.get(sessionName)!;
  }

  const getSessionStatus = async (name: string): Promise<OpenWASession | null> => {
    try {
      const list = await getOpenWASessions();
      return list.find(s => s.name === name) || null;
    } catch {
      return null;
    }
  };

  const promise = (async () => {
    let session = await getSessionStatus(sessionName);
    if (!session) throw new Error(`Sesión "${sessionName}" no encontrada.`);

    if (session.status === 'ready') return session;

    const needsStart = ['disconnected', 'failed', 'created'].includes(session.status);
    if (needsStart) {
      try {
        await fetch(`${apiUrl}/sessions/${session.id}/start`, {
          method: 'POST',
          headers: getHeaders(apiKey),
        });
      } catch {
        // Ignorar errores de red
      }
    }

    const maxWait = 20000;
    const interval = 1000;
    let waited = 0;

    while (waited < maxWait) {
      await new Promise(r => setTimeout(r, interval));
      waited += interval;
      session = await getSessionStatus(sessionName);
      if (!session) throw new Error(`Sesión "${sessionName}" desapareció.`);
      if (session.status === 'ready') return session;
      if (session.status === 'failed') throw new Error(`La sesión falló al conectarse.`);
    }

    throw new Error(`La sesión no se conectó en el tiempo esperado.`);
  })();

  sessionReadyPromises.set(sessionName, promise);

  try {
    const result = await promise;
    // Limpiamos la promesa si todo salió bien, pero después de un segundito
    // para que las llamadas concurrentes inmediatas alcancen a colgarse de ella.
    setTimeout(() => sessionReadyPromises.delete(sessionName), 1000);
    return result;
  } catch (e) {
    sessionReadyPromises.delete(sessionName);
    throw e;
  }
}

// 4.1. Obtener grupos de una sesión
export async function getOpenWAGroups(sessionNameOverride?: string): Promise<OpenWAGroup[]> {
  return []; // Deshabilitado: Kapso no soporta leer grupos
}

// 4.2. Obtener contactos de una sesión
// Caching variables para no saturar el backend con búsquedas constantes
let cachedContacts: OpenWAContact[] | null = null;
let lastContactsFetch = 0;

export async function getOpenWAContacts(sessionNameOverride?: string): Promise<OpenWAContact[]> {
  return []; // Deshabilitado: Kapso no soporta leer contactos del teléfono
}

// 4.2b. Obtener un contacto individual por su ID (JID) — resuelve nombre guardado
export async function getOpenWAContactById(
  contactId: string,
  sessionNameOverride?: string
): Promise<OpenWAContact | null> {
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  try {
    const list = await getOpenWASessions();
    const session = list.find(s => s.name === sessionName);
    if (!session) return null;

    const res = await fetch(`${apiUrl}/sessions/${session.id}/contacts/${encodeURIComponent(contactId)}`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// 4.3. Obtener el código QR de una sesión
export async function getOpenWAQRCode(sessionNameOverride?: string): Promise<string | null> {
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  try {
    const list = await getOpenWASessions();
    const session = list.find(s => s.name === sessionName);
    if (!session) return null;

    const res = await fetch(`${apiUrl}/sessions/${session.id}/qr`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.qrCode || null;
  } catch (error) {
    console.error('Error fetching OpenWA QR:', error);
    return null;
  }
}

// 4.4. Obtener la lista de chats más recientes basado en mensajes reales (como WhatsApp)
export interface ChatSummary {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage?: string;
}

let cachedChats: ChatSummary[] | null = null;
let lastChatsFetch = 0;

export async function getOpenWAChats(sessionNameOverride?: string, messageLimit: number = 50): Promise<ChatSummary[]> {
  return []; // Deshabilitado: Kapso no soporta leer chats recientes
}

// Sanitizar y formatear el número de celular para que termine en @c.us o @g.us
export function formatWhatsAppJID(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  if (trimmed.endsWith('@g.us') || trimmed.endsWith('@c.us')) {
    return trimmed;
  }
  // Limpiar caracteres no numéricos para teléfonos estándar
  const cleanNum = trimmed.replace(/[^0-9]/g, '');
  if (!cleanNum) return '';
  return `${cleanNum}@c.us`;
}

// 5. Enviar mensaje de texto
export async function sendWhatsAppTextMessage(
  phoneNumber: string,
  text: string,
  sessionNameOverride?: string
): Promise<{ messageId: string; timestamp: number }> {
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  const chatId = formatWhatsAppJID(phoneNumber);

  if (!chatId) {
    throw new Error('El número de teléfono proporcionado no es válido.');
  }

  try {
    // Asegurar que la sesión esté activa (reconectar automáticamente si hace falta)
    const session = await ensureSessionReady(sessionName);

    // Enviar el mensaje usando el UUID de la sesión
    const res = await fetch(`${apiUrl}/sessions/${session.id}/messages/send-text`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        chatId,
        text: text.trim(),
      }),
    });

    if (!res.ok) {
      await handleOpenWAError(res);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error(error.message || 'Error al enviar el mensaje de WhatsApp.');
  }
}

// 6. Enviar archivo/imagen con caption
export async function sendWhatsAppImageMessage(
  phoneNumber: string,
  imageUrlOrBase64: string,
  caption?: string,
  sessionNameOverride?: string
): Promise<{ messageId: string; timestamp: number }> {
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  const chatId = formatWhatsAppJID(phoneNumber);

  if (!chatId) {
    throw new Error('El número de teléfono proporcionado no es válido.');
  }

  try {
    // Asegurar que la sesión esté activa (reconectar automáticamente si hace falta)
    const session = await ensureSessionReady(sessionName);


    const payload: any = { chatId, caption: caption?.trim() };

    // Si es un base64 o Data URL
    if (imageUrlOrBase64.startsWith('data:') || !imageUrlOrBase64.startsWith('http')) {
      const parts = imageUrlOrBase64.split(',');
      const base64Data = parts[1] || parts[0];
      const match = imageUrlOrBase64.match(/data:([^;]+);/);
      let mimetype = match ? match[1] : 'image/jpeg';

      // Si el fetch del blob devolvió algo que no es imagen (ej. text/html por un error 404/CORS)
      // forzamos un mimetype de imagen para evitar que WhatsApp Web crashee con "Error: t".
      if (!mimetype.startsWith('image/')) {
        mimetype = 'image/jpeg';
      }

      payload.base64 = base64Data;
      payload.mimetype = mimetype;
      const ext = mimetype.split('/')[1] || 'jpeg';
      payload.filename = `imagen.${ext}`;
    } else {
      // Si es una URL pública ordinaria
      payload.url = imageUrlOrBase64;
    }

    const res = await fetch(`${apiUrl}/sessions/${session.id}/messages/send-image`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await handleOpenWAError(res);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error sending WhatsApp image:', error);
    throw new Error(error.message || 'Error al enviar la imagen por WhatsApp.');
  }
}
