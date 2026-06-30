// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const PROJECT_REF = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "project_ref";

serve(async (req) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: publicaciones, error: pubError } = await supabase
      .from('publicaciones')
      .select('*, redes_sociales(nombre_red), campaigns(id_cliente, id_usuario)')
      .eq('estado', 'Programada')
      .is('ayrshare_post_id', null)
      .lte('fecha_publicacion', new Date().toISOString());

    if (pubError) throw pubError;

    if (!publicaciones || publicaciones.length === 0) {
      return new Response(JSON.stringify({ message: "No hay publicaciones listas para publicar" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    let publishedCount = 0;
    const errors = [];

    for (const pub of publicaciones) {
      try {
        let plat = 'facebook';
        let nred = '';
        if (pub.redes_sociales) {
          if (Array.isArray(pub.redes_sociales)) {
            nred = pub.redes_sociales[0]?.nombre_red?.toLowerCase() || '';
          } else {
            nred = (pub.redes_sociales as any).nombre_red?.toLowerCase() || '';
          }
        }
        if (nred.includes('insta')) plat = 'instagram';
        else if (nred.includes('twit') || nred.includes('x')) plat = 'twitter';
        else if (nred.includes('link')) plat = 'linkedin';
        else if (nred.includes('tik')) plat = 'tiktok';
        else if (nred.includes('tele')) plat = 'telegram';

        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('publish_social', {
          body: {
            post: pub.contenido,
            platforms: [plat],
            mediaUrls: pub.imagen_url ? [pub.imagen_url] : []
          }
        });

        if (invokeError) throw invokeError;
        if (invokeData?.error) throw new Error(invokeData.error);

        const updatePayload: any = { estado: 'Publicada' };
        if (invokeData?.postId) updatePayload.ayrshare_post_id = invokeData.postId;

        await supabase.from('publicaciones').update(updatePayload).eq('id_publicacion', pub.id_publicacion);
        publishedCount++;

        // Enviar email de notificación de éxito al usuario dueño
        const gmailEmail = Deno.env.get("GMAIL_EMAIL");
        const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

        if (gmailEmail && gmailPassword) {
          try {
            const currentDate = new Date();
            const dateStr = currentDate.toLocaleDateString('es-ES');
            const timeStr = currentDate.toLocaleTimeString('es-ES');
            
            // Obtener el ID del usuario dueño de la campaña
            const idUsuario = pub.campaigns?.id_usuario;
            let emailCliente = null;
            let nombreCliente = "Usuario";
            
            if (idUsuario) {
              // Obtener el correo directamente de auth.users usando Supabase Admin
              const { data: userData } = await supabase.auth.admin.getUserById(idUsuario);
              if (userData && userData.user && userData.user.email) {
                emailCliente = userData.user.email;
                nombreCliente = userData.user.user_metadata?.nombre || userData.user.user_metadata?.full_name || "Usuario";
              }
            }

            // Si no pudimos obtener el correo desde id_usuario, intentar con clientes como fallback
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

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981; margin-bottom: 10px;">¡Publicación Exitosa!</h2>
                <p style="color: #334155; font-size: 15px;">Hola <strong>${nombreCliente}</strong>,</p>
                <p style="color: #475569;">Te informamos que la publicación ha sido subida exitosamente a la red social.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <ul style="list-style: none; padding: 0; margin: 0; color: #1e293b; line-height: 1.6;">
                    <li><strong>📝 Nombre:</strong> ${pub.titulo}</li>
                    <li><strong>📱 Red social:</strong> <span style="text-transform: capitalize;">${plat}</span></li>
                    <li><strong>✅ Estado:</strong> Publicada</li>
                    <li><strong>📅 Fecha:</strong> ${dateStr}</li>
                    <li><strong>⏰ Hora:</strong> ${timeStr}</li>
                  </ul>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 20px;">
                  <p style="margin: 0; color: #64748b; font-size: 13px;"><em>Vista previa del contenido:</em></p>
                  <p style="color: #475569; white-space: pre-wrap; font-size: 14px; margin-top: 8px;">${pub.contenido}</p>
                </div>
              </div>
            `;
            
            // Importar SmtpClient dinámicamente
            const { SmtpClient } = await import("https://deno.land/x/smtp/mod.ts");
            
            // 1. Enviar correo al Administrador (Siempre)
            const admin_smtp = new SmtpClient();
            await admin_smtp.connectTLS({ hostname: "smtp.gmail.com", port: 465, username: gmailEmail, password: gmailPassword });
            await admin_smtp.send({
              from: gmailEmail,
              to: gmailEmail, // Admin email
              subject: `¡Publicación Exitosa! - ${pub.titulo}`,
              content: "auto",
              html: emailHtml,
            });
            await admin_smtp.close();

            // 2. Enviar correo al Dueño (Si no es el mismo que el admin)
            if (emailCliente && emailCliente !== gmailEmail) {
              const client_smtp = new SmtpClient();
              await client_smtp.connectTLS({ hostname: "smtp.gmail.com", port: 465, username: gmailEmail, password: gmailPassword });
              await client_smtp.send({
                from: gmailEmail,
                to: emailCliente,
                subject: `Publicación subida exitosamente: ${pub.titulo}`,
                content: "auto",
                html: emailHtml,
              });
              await client_smtp.close();
              console.log(`Email de éxito enviado a ${emailCliente}`);
            }
          } catch (err) {
            console.error("Error enviando email vía Gmail SMTP:", err);
          }
        }
      } catch (e: any) {
        console.error(`Error publishing ${pub.id_publicacion}:`, e);
        errors.push({ id: pub.id_publicacion, error: e.message });
        // Marcar como 'Fallida' para evitar que intente publicarse en bucle infinito cada minuto
        await supabase.from('publicaciones').update({ estado: 'Fallida' }).eq('id_publicacion', pub.id_publicacion);
      }
    }

    return new Response(JSON.stringify({ message: "Proceso completado", publishedCount, errors }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
