// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!id || !action) {
      return new Response("Faltan parámetros", { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return new Response("Acción inválida", { status: 400 });
    }

    const { data: pub, error: pubError } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('id_publicacion', id)
      .single();

    if (pubError || !pub) {
      return new Response("Publicación no encontrada", { status: 404 });
    }

    if (pub.estado !== 'Pendiente Aprobacion') {
      return new Response("La publicación ya no está pendiente de aprobación", { status: 400 });
    }

    const newEstado = action === 'approve' ? 'Programada' : 'Cancelada';

    const { error: updateError } = await supabase
      .from('publicaciones')
      .update({ estado: newEstado })
      .eq('id_publicacion', id);

    if (updateError) {
      throw updateError;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Publicación ${action === 'approve' ? 'Aprobada' : 'Rechazada'}</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8fafc; }
          .container { background-color: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          h1 { color: ${action === 'approve' ? '#10b981' : '#f43f5e'}; }
          p { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>¡Publicación ${action === 'approve' ? 'Aprobada' : 'Rechazada'}!</h1>
          <p>La publicación "${pub.titulo}" ha sido ${action === 'approve' ? 'aprobada y será programada para su publicación' : 'rechazada'}.</p>
          <p>Puedes cerrar esta ventana.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
