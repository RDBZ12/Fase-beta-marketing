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
  const localUrl = localStorage.getItem('openwa_api_url');
  const localKey = localStorage.getItem('openwa_api_key');
  const localSession = localStorage.getItem('openwa_session_name') || 'marketing-bot';

  return {
    apiUrl: localUrl || import.meta.env.VITE_OPENWA_API_URL || 'http://localhost:2886/api',
    apiKey: localKey || import.meta.env.VITE_OPENWA_API_KEY || 'owa_k1_2f95a1fb9205aed468bb424e3e461eece693a50a775a45cec23dade984ea733b',
    sessionName: localSession,
  };
}

export function saveOpenWASettings(url: string, key: string, sessionName: string) {
  localStorage.setItem('openwa_api_url', url.trim());
  localStorage.setItem('openwa_api_key', key.trim());
  localStorage.setItem('openwa_session_name', sessionName.trim());
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

// 1. Obtener todas las sesiones
export async function getOpenWASessions(): Promise<OpenWASession[]> {
  const { apiUrl, apiKey } = getOpenWASettings();
  try {
    const res = await fetch(`${apiUrl}/sessions`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error('Error fetching OpenWA sessions:', error);
    throw new Error(error.message || 'No se pudo conectar con el servidor de OpenWA.');
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
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
  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  try {
    const session = await ensureSessionReady(sessionName);

    const res = await fetch(`${apiUrl}/sessions/${session.id}/groups`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching OpenWA groups:', error);
    return [];
  }
}

// 4.2. Obtener contactos de una sesión
// Caching variables para no saturar el backend con búsquedas constantes
let cachedContacts: OpenWAContact[] | null = null;
let lastContactsFetch = 0;

export async function getOpenWAContacts(sessionNameOverride?: string): Promise<OpenWAContact[]> {
  const now = Date.now();
  if (cachedContacts && (now - lastContactsFetch < 300000)) { // Cache de 5 minutos
    return cachedContacts;
  }

  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  try {
    const list = await getOpenWASessions();
    const session = list.find(s => s.name === sessionName);
    if (!session) return [];

    const res = await fetch(`${apiUrl}/sessions/${session.id}/contacts`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    const filteredData = Array.isArray(data) ? data.filter((c: any) => !(c.id || '').endsWith('@lid')) : [];
    cachedContacts = filteredData;
    lastContactsFetch = Date.now();
    return filteredData;
  } catch (error) {
    console.error('Error fetching OpenWA contacts:', error);
    return [];
  }
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
  const isFullLoad = messageLimit > 50;
  const now = Date.now();
  
  // Usar caché si es una carga completa (búsqueda) y hace menos de 2 minutos se cargó
  if (isFullLoad && cachedChats && (now - lastChatsFetch < 120000)) {
    return cachedChats;
  }

  const { apiUrl, apiKey, sessionName: defaultSessionName } = getOpenWASettings();
  const sessionName = sessionNameOverride || defaultSessionName;
  try {
    const session = await ensureSessionReady(sessionName);

    // 1. Llamar al endpoint /chats para obtener la agenda completa y nombres reales
    const chatsRes = await fetch(`${apiUrl}/sessions/${session.id}/chats`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    
    // 2. Llamar al endpoint /messages para obtener la verdadera actividad reciente (workaround para Baileys)
    const msgsRes = await fetch(`${apiUrl}/sessions/${session.id}/messages?limit=${messageLimit}`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });

    const chatsData = chatsRes.ok ? await chatsRes.json() : [];
    const msgsData = msgsRes.ok ? await msgsRes.json() : [];
    const messages: any[] = Array.isArray(msgsData) ? msgsData : (msgsData.messages ?? []);

    // 3. Crear un mapa base con los chats (grupos y contactos) que tienen su nombre resuelto
    const chatMap = new Map<string, ChatSummary>();
    for (const chat of (chatsData || [])) {
      const originalId = chat.originalJid || chat.id;
      if (originalId.endsWith('@lid')) continue;
      // Normalizamos el ID limpiando @c.us o @s.whatsapp.net para poder cruzarlo
      const cleanId = originalId.split('@')[0].split(':')[0];
      
      chatMap.set(cleanId, {
        id: originalId,
        name: chat.nombre || chat.id,
        isGroup: chat.tipo === 'grupo',
        unreadCount: chat.unreadCount || 0,
        timestamp: chat.timestamp || 0,
        lastMessage: chat.lastMessage,
      });
    }

    // 4. Actualizar los timestamps y lastMessage usando los mensajes recientes
    for (const msg of messages) {
      const chatId = msg.chatId;
      if (!chatId || chatId === 'status@broadcast' || chatId.includes('broadcast') || chatId.endsWith('@lid')) continue;
      
      const cleanId = chatId.split('@')[0].split(':')[0];
      const ts = msg.timestamp ?? 0;
      
      const existing = chatMap.get(cleanId);
      if (existing) {
        if (ts > existing.timestamp) {
          existing.timestamp = ts;
          existing.lastMessage = msg.body ?? existing.lastMessage;
        }
      } else {
        // Si hay un mensaje de alguien que no estaba en /chats, lo agregamos
        chatMap.set(cleanId, {
          id: chatId,
          name: cleanId, // Fallback al número temporal
          isGroup: chatId.endsWith('@g.us'),
          unreadCount: 0,
          timestamp: ts,
          lastMessage: msg.body ?? '',
        });
      }
    }

    // 5. Convertir a array y ordenar: los recientes primero
    const sorted = Array.from(chatMap.values()).sort((a, b) => b.timestamp - a.timestamp);

    if (isFullLoad) {
      cachedChats = sorted;
      lastChatsFetch = Date.now();
    }

    return sorted;
  } catch (error) {
    console.error('Error fetching OpenWA chats from messages:', error);
    return [];
  }
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error sending WhatsApp image:', error);
    throw new Error(error.message || 'Error al enviar la imagen por WhatsApp.');
  }
}
