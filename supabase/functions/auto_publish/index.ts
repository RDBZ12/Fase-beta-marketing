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
      .select('*, redes_sociales(nombre_red), campaigns(id_cliente)')
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
        const nred = pub.redes_sociales?.nombre_red?.toLowerCase() || '';
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

        // Enviar email de notificación de éxito
        const idCliente = pub.campaigns?.id_cliente;
        if (idCliente) {
          const { data: client } = await supabase.from('clientes').select('correo, nombre_empresa').eq('id_cliente', idCliente).single();
          
          const gmailEmail = Deno.env.get("GMAIL_EMAIL");
          const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
          
          if (client && client.correo && gmailEmail && gmailPassword) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981;">¡Publicación Exitosa!</h2>
                <p>Hola ${client.nombre_empresa},</p>
                <p>Te informamos que tu publicación ha sido subida exitosamente a las redes sociales.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #0f172a;">${pub.titulo}</h3>
                  <p style="color: #475569; white-space: pre-wrap;">${pub.contenido}</p>
                </div>
                <p>¡Gracias por confiar en nosotros!</p>
              </div>
            `;
            
            try {
              // Importar SmtpClient dinámicamente o globalmente. En Deno podemos hacerlo así:
              const { SmtpClient } = await import("https://deno.land/x/smtp/mod.ts");
              const client_smtp = new SmtpClient();
              
              await client_smtp.connectTLS({
                hostname: "smtp.gmail.com",
                port: 465,
                username: gmailEmail,
                password: gmailPassword,
              });

              await client_smtp.send({
                from: gmailEmail,
                to: client.correo,
                subject: `Publicación subida exitosamente: ${pub.titulo}`,
                content: "auto",
                html: emailHtml,
              });

              await client_smtp.close();
            } catch (err) {
              console.error("Error enviando email vía Gmail SMTP:", err);
            }
          }
        }
      } catch (e: any) {
        console.error(`Error publishing ${pub.id_publicacion}:`, e);
        errors.push({ id: pub.id_publicacion, error: e.message });
      }
    }

    return new Response(JSON.stringify({ message: "Proceso completado", publishedCount, errors }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
