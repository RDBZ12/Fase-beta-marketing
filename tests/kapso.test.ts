import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendKapsoMessage } from '../src/lib/whatsappService';

describe('QA - Integración con Kapso (WhatsApp)', () => {
  beforeEach(() => {
    // Mock global de fetch para aislar la prueba de la red
    global.fetch = vi.fn();
    
    // Inyectar variables de entorno de prueba para Vite
    vi.stubEnv('VITE_KAPSO_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_KAPSO_PHONE_NUMBER_ID', 'test-phone-id');
  });

  it('Debe formatear correctamente la petición HTTP y enviar el mensaje', async () => {
    // Simular respuesta exitosa
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message_id: 'msg-123' }),
    });

    const destino = '18291234567';
    const mensaje = 'Hola desde Kapso Test';

    const result = await sendKapsoMessage(destino, mensaje);

    expect(result).toEqual({ success: true, message_id: 'msg-123' });
    
    // Verificar que fetch se haya llamado con los parámetros exactos requeridos por Kapso
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.kapso.ai/meta/whatsapp/v24.0/test-phone-id/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: destino,
          type: 'text',
          text: { body: mensaje }
        })
      })
    );
  });

  it('Debe capturar y lanzar un error limpio cuando la API falla', async () => {
    // Simular error 401 Unauthorized
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid API Key' }),
    });

    await expect(sendKapsoMessage('18291234567', 'Hola')).rejects.toThrow(
      'Kapso API Error (401): {"error":"Invalid API Key"}'
    );
  });
});
