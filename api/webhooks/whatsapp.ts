export default async function handler(req: any, res: any) {
  // Solo aceptamos peticiones POST para los webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const eventType = req.headers['x-webhook-event'];

    // Verificamos que sea un evento de Kapso
    if (eventType === 'whatsapp.message.received') {
      const payload = req.body;
      console.log('📬 Nuevo mensaje de WhatsApp recibido vía Kapso:', JSON.stringify(payload));

      // Aquí puedes procesar el mensaje, guardarlo en la base de datos de Supabase, 
      // o activar alguna función de tu bot.
      
      // Kapso requiere que le respondamos un status 200 rápido para saber que lo recibimos
      return res.status(200).send('OK');
    }

    // Para cualquier otro evento que no estemos manejando
    return res.status(200).send('Evento ignorado');
  } catch (error) {
    console.error('Error procesando webhook de Kapso:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
