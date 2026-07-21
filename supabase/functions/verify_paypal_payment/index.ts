// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getPayPalAccessToken(): Promise<string> {
  const clientId     = Deno.env.get('PAYPAL_CLIENT_ID')!
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!
  const base         = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const json = await res.json()
  return json.access_token as string
}

async function capturePayPalOrder(orderId: string, accessToken: string): Promise<any> {
  const base = Deno.env.get('PAYPAL_BASE_URL') ?? 'https://api-m.sandbox.paypal.com'
  const res  = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const json = await res.json()
  return json
}

function getDOFormattedDates() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const doDate = new Date(utc + (3600000 * -4)); // UTC-4

  const day = String(doDate.getDate()).padStart(2, '0');
  const month = String(doDate.getMonth() + 1).padStart(2, '0');
  const year = doDate.getFullYear();
  
  const hours = String(doDate.getHours()).padStart(2, '0');
  const minutes = String(doDate.getMinutes()).padStart(2, '0');
  const seconds = String(doDate.getSeconds()).padStart(2, '0');

  const fechaEmision = `${day}-${month}-${year}`;
  const fechaHoraFirma = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

  return { fechaEmision, fechaHoraFirma };
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, campana_id, monto_esperado, rnc_cedula, razon_social } =
      await req.json()

    if (!order_id || !campana_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros obligatorios: order_id y campana_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 1. Verificar y capturar el pago con PayPal ─────────────────────────
    const accessToken = await getPayPalAccessToken()
    const orderDetails = await capturePayPalOrder(order_id, accessToken)

    if (orderDetails.status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: `Pago no completado. Estado PayPal: ${orderDetails.status}` }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Validar monto (prevenir manipulación del frontend) ──────────────
    const montoCapturado = parseFloat(
      orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0'
    )

    if (monto_esperado && Math.abs(montoCapturado - monto_esperado) > 0.01) {
      return new Response(
        JSON.stringify({
          error: `Monto no coincide. Esperado: ${monto_esperado}, Recibido: ${montoCapturado}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Verificar que el order_id no fue usado antes (idempotencia) ─────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Usa service role para saltar RLS
    )

    // ── 3.1 Extraer id_usuario de forma segura desde el JWT ─────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Falta token de autorización. Debes iniciar sesión.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authErr } = await supabase.auth.getUser(token)
    const user = authData?.user

    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado o token inválido.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const id_usuario_seguro = user.id;

    const { data: pagoExistente } = await supabase
      .from('pagos')
      .select('id_pago')
      .eq('paypal_order_id', order_id)
      .maybeSingle()

    // ── 3.2 Validar estado de moderación y precio mínimo de campaña ────────
    const { data: campanaDB, error: campErr } = await supabase
      .from('campaigns')
      .select('estado_moderacion')
      .eq('id', campana_id)
      .single()
    
    if (campErr || !campanaDB) {
      return new Response(
        JSON.stringify({ error: 'Campaña no encontrada.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (campanaDB.estado_moderacion !== 'aprobada') {
      return new Response(
        JSON.stringify({ error: 'La campaña no ha sido aprobada por moderación.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: config } = await supabase
      .from('configuracion_sistema')
      .select('valor')
      .eq('clave', 'precio_minimo_campana')
      .single()
    
    const precioMinimo = config?.valor || 5.83
    if (monto_esperado < precioMinimo || montoCapturado < precioMinimo) {
      return new Response(
        JSON.stringify({ error: `El monto pagado (${montoCapturado}) es inferior al mínimo permitido (${precioMinimo}).` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (pagoExistente) {
      return new Response(
        JSON.stringify({ error: 'Esta orden de PayPal ya fue procesada anteriormente.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Generar NCF Vía API ECF ─────────────────────────────────────────
    let ncf = 'Pendiente DGII'

    // Conversión de USD a DOP (tasa fija aproximada de 59.00)
    const TASA_CAMBIO = 59.00
    const montoCapturadoDOP = montoCapturado * TASA_CAMBIO

    const monto  = montoCapturadoDOP / 1.18 // monto sin ITBIS en DOP
    const itbis  = montoCapturadoDOP - monto
    const total  = montoCapturadoDOP

    let ecfResponseData = null;

    try {
      const ecfApiKey = Deno.env.get('ECF_API_KEY')
      if (ecfApiKey) {
        const { fechaEmision, fechaHoraFirma } = getDOFormattedDates()

        const ecfPayload = {
          "ECF": {
            "Encabezado": {
              "IdDoc": {
                "TipoeCF": "32",
                "TipoPago": "1",
                "TipoIngresos": "01",
                "TablaFormasPago": {
                  "FormaDePago": [
                    {
                      "FormaPago": "1",
                      "MontoPago": total.toFixed(2)
                    }
                  ]
                },
                "IndicadorMontoGravado": "0",
                "IndicadorEnvioDiferido": "1"
              },
              "Emisor": {
                "RNCEmisor": "132907401",
                "CorreoEmisor": "utesa@utesa.edu.com",
                "FechaEmision": fechaEmision,
                "DireccionEmisor": "Santiago",
                "NombreComercial": "UTESA",
                "RazonSocialEmisor": "UTESA",
                "TablaTelefonoEmisor": {
                  "TelefonoEmisor": [
                    "829-282-7556"
                  ]
                }
              },
              "Totales": {
                "ITBIS1": "18",
                "MontoTotal": total.toFixed(2),
                "TotalITBIS": itbis.toFixed(2),
                "MontoExento": "0",
                "TotalITBIS1": itbis.toFixed(2),
                "MontoGravadoI1": monto.toFixed(2),
                "MontoGravadoTotal": monto.toFixed(2),
                "MontoNoFacturable": "0"
              },
              "Version": "1.0"
            },
            "DetallesItems": {
              "Item": {
                "MontoItem": monto.toFixed(2),
                "NombreItem": "Pago de Campaña Marketing",
                "NumeroLinea": "1",
                "CantidadItem": "1",
                "UnidadMedida": "43",
                "PrecioUnitarioItem": monto.toFixed(2),
                "IndicadorFacturacion": "1",
                "IndicadorBienoServicio": "1"
              }
            },
            "FechaHoraFirma": fechaHoraFirma
          }
        }
        
        const ecfRes = await fetch('https://ecf-platform-backend-50801509587.us-central1.run.app/api/v1/ecf/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ecfApiKey
          },
          body: JSON.stringify(ecfPayload)
        })
        
        if (ecfRes.ok) {
          const ecfData = await ecfRes.json()
          ecfResponseData = ecfData;
          if (ecfData.encf) ncf = ecfData.encf
        } else {
          console.error("Error API ECF:", await ecfRes.text())
        }
      }
    } catch (e) {
      console.error("Error en llamada a API ECF:", e)
    }

    // ── 5. Actualizar campaña a "Activa" ──────────────────────────────────
    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({ estado: 'Activa' })
      .eq('id', campana_id)

    if (updateErr) throw new Error(`Error actualizando campaña: ${updateErr.message}`)

    // ── 6. Insertar registro de pago ──────────────────────────────────────
    const dgiiUrl = ecfResponseData?.dgiiUrl ?? null;
    const { data: nuevoPago, error: insertErr } = await supabase
      .from('pagos')
      .insert({
        id_campana:      campana_id,
        id_usuario:      id_usuario_seguro,
        paypal_order_id: order_id,
        monto:           parseFloat(monto.toFixed(2)),
        fecha:           new Date().toISOString(),
        ncf,
        estado_dgii:     'Aceptado',
        metodo_pago:     'PayPal',
        rnc_cedula:      rnc_cedula ?? null,
        razon_social:    razon_social ?? null,
        tipo_comprobante: 'Factura de Consumo',
        url_dgii:        dgiiUrl,
      })
      .select()
      .single()

    if (insertErr) throw new Error(`Error insertando pago: ${insertErr.message}`)

    // ── 7. Responder con éxito ────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok:  true,
        ncf,
        pago: nuevoPago,
        monto_cobrado: total,
        dgii_response: ecfResponseData,
        url_dgii: dgiiUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[verify_paypal_payment] Error:', err)
    return new Response(
      JSON.stringify({ error: err.message ?? 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
