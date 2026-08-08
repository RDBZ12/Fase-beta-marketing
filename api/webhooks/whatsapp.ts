import { createClient } from "@supabase/supabase-js";

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
      console.log('📬 Nuevo mensaje de WhatsApp recibido vía Kapso');

      // Intentamos extraer datos de Meta/Kapso Webhook
      const changes = payload.entry?.[0]?.changes?.[0]?.value;
      const contactInfo = changes?.contacts?.[0];
      const messageInfo = changes?.messages?.[0];

      const phone = contactInfo?.wa_id || messageInfo?.from || payload.wa_id || payload.from;
      const name = contactInfo?.profile?.name || payload.contact_name || payload.name || `WhatsApp ${phone}`;
      const textBody = messageInfo?.text?.body || payload.text?.body || payload.text || '';

      if (phone) {
        // Inicializar Supabase en el servidor
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Verificar si el lead ya existe por teléfono
          const { data: existingLeads } = await supabase
            .from('leads')
            .select('id_lead')
            .eq('telefono', phone)
            .limit(1);

          if (!existingLeads || existingLeads.length === 0) {
            // Crear el Lead si no existe
            const newLead = {
              nombre: name,
              telefono: phone,
              estado: 'Nuevo',
              interes: textBody ? `Contacto automático vía WhatsApp: "${textBody.substring(0, 50)}..."` : 'Contacto vía WhatsApp'
            };
            
            const { error: insertError } = await supabase.from('leads').insert([newLead]);
            if (insertError) {
              console.error('Error insertando lead automático:', insertError);
            } else {
              console.log(`✅ Lead creado automáticamente para ${phone}`);
            }
          } else {
             // Opcional: Actualizar lead existente para marcar actividad
             console.log(`ℹ️ El lead ${phone} ya existe en la base de datos.`);
          }
        } else {
          console.warn('⚠️ Variables de Supabase no configuradas en el entorno del webhook.');
        }
      }

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
