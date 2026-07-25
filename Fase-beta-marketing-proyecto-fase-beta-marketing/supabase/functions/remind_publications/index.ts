// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    let emailsSent = 0;
    const errors = [];

    const gmailEmail = Deno.env.get("GMAIL_EMAIL");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailEmail || !gmailPassword) {
      throw new Error("Faltan credenciales GMAIL_EMAIL o GMAIL_APP_PASSWORD");
    }

    // Importar SmtpClient dinámicamente
    const { SmtpClient } = await import("https://deno.land/x/smtp/mod.ts");

    // ==========================================
    // 1. RECORDATORIOS DE PUBLICACIONES RETRASADAS
    // ==========================================
    const { data: publicaciones, error: pubError } = await supabase
      .from('publicaciones')
      .select('*, campaigns(id_cliente, id_usuario)')
      .eq('estado', 'Programada')
      .lte('fecha_publicacion', threeHoursAgo)
      .or(`last_reminder_at.lte.${threeHoursAgo},last_reminder_at.is.null`);

    if (pubError) console.error("Error obteniendo publicaciones:", pubError);

    if (publicaciones && publicaciones.length > 0) {
      for (const pub of publicaciones) {
        try {
          const idUsuario = pub.campaigns?.id_usuario;
          let emailCliente = null;
          let nombreCliente = "Usuario";

          if (idUsuario) {
            const { data: userData } = await supabase.auth.admin.getUserById(idUsuario);
            if (userData && userData.user && userData.user.email) {
              emailCliente = userData.user.email;
              nombreCliente = userData.user.user_metadata?.nombre || userData.user.user_metadata?.full_name || "Usuario";
            }
          }

          if (!emailCliente) {
            const idCliente = pub.campaigns?.id_cliente;
            if (idCliente) {
              const { data: client } = await supabase.from('clientes').select('correo, nombre_empresa').eq('id_cliente', idCliente).single();
              if (client && client.correo) {
                emailCliente = client.correo;
                nombreCliente = client.nombre_empresa;
              }
            }
          }

          if (!emailCliente) continue;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #f59e0b; margin-bottom: 10px;">⚠️ Recordatorio de Publicación Pendiente</h2>
              <p style="color: #334155; font-size: 15px;">Hola <strong>${nombreCliente}</strong>,</p>
              <p style="color: #475569;">Te recordamos que tienes una publicación que lleva más de 3 horas retrasada y aún no se ha podido publicar.</p>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <ul style="list-style: none; padding: 0; margin: 0; color: #78350f; line-height: 1.6;">
                  <li><strong>📝 Nombre:</strong> ${pub.titulo}</li>
                  <li><strong>⏳ Estado:</strong> Pendiente / Retrasada</li>
                  <li><strong>📅 Programada para:</strong> ${new Date(pub.fecha_publicacion).toLocaleString('es-ES')}</li>
                </ul>
              </div>
              <p style="color: #475569; font-size: 14px;">Por favor, revisa el sistema para asegurar que todo esté configurado correctamente.</p>
            </div>
          `;

          const client_smtp = new SmtpClient();
          await client_smtp.connectTLS({ hostname: "smtp.gmail.com", port: 465, username: gmailEmail, password: gmailPassword });
          await client_smtp.send({
            from: gmailEmail, to: emailCliente,
            subject: `⚠️ Recordatorio: Publicación retrasada - ${pub.titulo}`,
            content: "auto", html: emailHtml,
          });
          await client_smtp.close();

          await supabase.from('publicaciones').update({ last_reminder_at: new Date().toISOString() }).eq('id_publicacion', pub.id_publicacion);
          emailsSent++;
        } catch (e: any) {
          console.error(`Error procesando recordatorio para publicación ${pub.id_publicacion}:`, e);
          errors.push({ type: 'publicacion', id: pub.id_publicacion, error: e.message });
        }
      }
    }

    // ==========================================
    // 2. RECORDATORIOS DE CAMPAÑAS PENDIENTES
    // ==========================================
    const { data: pendingCampaigns, error: campError } = await supabase
      .from('campaigns')
      .select('*, clientes!campaigns_id_cliente_fkey(correo, nombre_empresa)')
      .eq('estado', 'Borrador')
      .or(`last_reminder_at.lte.${threeHoursAgo},last_reminder_at.is.null`);

    if (campError) console.error("Error obteniendo campañas:", campError);

    if (pendingCampaigns && pendingCampaigns.length > 0) {
      for (const camp of pendingCampaigns) {
        try {
          const idUsuario = camp.id_usuario;
          let emailCliente = null;
          let nombreCliente = "Usuario";

          if (idUsuario) {
            const { data: userData } = await supabase.auth.admin.getUserById(idUsuario);
            if (userData && userData.user && userData.user.email) {
              emailCliente = userData.user.email;
              nombreCliente = userData.user.user_metadata?.nombre || userData.user.user_metadata?.full_name || "Usuario";
            }
          }

          if (!emailCliente) {
            if (camp.clientes?.correo) {
              emailCliente = camp.clientes.correo;
              nombreCliente = camp.clientes.nombre_empresa || nombreCliente;
            }
          }

          if (!emailCliente) continue;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #8b5cf6; margin-bottom: 10px;">¡Tu Próxima Campaña está Lista! 🚀</h2>
              <p style="color: #334155; font-size: 15px;">Hola <strong>${nombreCliente}</strong>,</p>
              <p style="color: #475569;">Hemos notado que tienes una campaña excelente creada en el sistema, pero aún no la has activado.</p>
              <div style="background-color: #f5f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                <ul style="list-style: none; padding: 0; margin: 0; color: #4c1d95; line-height: 1.6;">
                  <li><strong>📝 Campaña:</strong> ${camp.nombre_campana || camp.brand}</li>
                  <li><strong>⏳ Estado:</strong> Pendiente de Activación / Pago</li>
                  <li><strong>💰 Presupuesto:</strong> $${camp.presupuesto} USD</li>
                </ul>
              </div>
              <p style="color: #475569; font-size: 14px; font-weight: bold;">¿Quieres que empecemos a subir tu siguiente campaña?</p>
              <p style="color: #475569; font-size: 14px;">Ingresa a la plataforma y realiza el pago para que el sistema programe y publique todo tu contenido de manera automática.</p>
            </div>
          `;

          const client_smtp = new SmtpClient();
          await client_smtp.connectTLS({ hostname: "smtp.gmail.com", port: 465, username: gmailEmail, password: gmailPassword });
          await client_smtp.send({
            from: gmailEmail, to: emailCliente,
            subject: `Activa tu próxima campaña: ${camp.nombre_campana || camp.brand}`,
            content: "auto", html: emailHtml,
          });
          await client_smtp.close();

          await supabase.from('campaigns').update({ last_reminder_at: new Date().toISOString() }).eq('id', camp.id);
          emailsSent++;
        } catch (e: any) {
          console.error(`Error procesando recordatorio para campaña ${camp.id}:`, e);
          errors.push({ type: 'campaña', id: camp.id, error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({ message: "Proceso completado", emailsSent, errors }), { 
      status: 200, headers: { "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
});
