// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const PROJECT_REF = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "project_ref";

serve(async (req) => {
  try {
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Find publications that are "Pendiente Aprobacion"
    const { data: publicaciones, error: pubError } = await supabase
      .from('publicaciones')
      .select('*, campaigns(idCliente, fechaInicio, fechaFin)')
      .eq('estado', 'Pendiente Aprobacion');

    if (pubError) {
      throw pubError;
    }

    if (!publicaciones || publicaciones.length === 0) {
      return new Response(JSON.stringify({ message: "No hay publicaciones pendientes de aprobación" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    let emailsSent = 0;

    for (const pub of publicaciones) {
      const idCliente = pub.campaigns?.idCliente;
      if (!idCliente) continue;

      const { data: client, error: clientError } = await supabase
        .from('clientes')
        .select('correo, nombre_empresa')
        .eq('id_cliente', idCliente)
        .single();

      if (clientError || !client || !client.correo) continue;

      // URL to approve or reject
      const baseUrl = `https://${PROJECT_REF}.supabase.co/functions/v1`;
      const approveUrl = `${baseUrl}/approve_publication?id=${pub.id_publicacion}&action=approve`;
      const rejectUrl = `${baseUrl}/approve_publication?id=${pub.id_publicacion}&action=reject`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #334155;">Aprobación de Publicación</h2>
          <p>Hola ${client.nombre_empresa},</p>
          <p>Tienes una publicación pendiente de aprobación para tu campaña.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">${pub.titulo}</h3>
            <p style="color: #475569; white-space: pre-wrap;">${pub.contenido}</p>
            ${pub.imagen_url ? `<img src="${pub.imagen_url}" style="max-width: 100%; border-radius: 4px; margin-top: 10px;" />` : ''}
          </div>
          <p>Fecha programada: ${new Date(pub.fecha_publicacion).toLocaleString('es-ES')}</p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${approveUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">Aprobar</a>
            <a href="${rejectUrl}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Rechazar</a>
          </div>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: "Notificaciones <onboarding@resend.dev>",
          to: [client.correo],
          subject: `Aprobación requerida: ${pub.titulo}`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        emailsSent++;
      } else {
        console.error("Resend error:", await res.text());
      }
    }

    return new Response(JSON.stringify({ message: "Proceso completado", emailsSent }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
