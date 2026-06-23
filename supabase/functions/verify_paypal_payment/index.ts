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

function generarNCF(secuencial: number): string {
  return `E32${String(secuencial).padStart(10, '0')}`
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

    const { data: pagoExistente } = await supabase
      .from('pagos')
      .select('id_pago')
      .eq('paypal_order_id', order_id)
      .maybeSingle()

    if (pagoExistente) {
      return new Response(
        JSON.stringify({ error: 'Esta orden de PayPal ya fue procesada anteriormente.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Generar NCF Vía API ECF ─────────────────────────────────────────
    const { count } = await supabase
      .from('pagos')
      .select('*', { count: 'exact', head: true })

    let ncf = generarNCF((count ?? 0) + 1) // Fallback simulado

    // Conversión de USD a DOP (tasa fija aproximada de 59.00)
    const TASA_CAMBIO = 59.00
    const montoCapturadoDOP = montoCapturado * TASA_CAMBIO

    const monto  = montoCapturadoDOP / 1.18 // monto sin ITBIS en DOP
    const itbis  = montoCapturadoDOP - monto
    const total  = montoCapturadoDOP

    try {
      const ecfApiKey = Deno.env.get('ECF_API_KEY')
      if (ecfApiKey) {
        const ecfPayload = {
          "ECF": {
            "Encabezado": {
              "IdDoc": {
                "eNCF": ncf,
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
                "FechaEmision": new Date().toLocaleDateString('es-DO', {day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\//g, '-'),
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
            "FechaHoraFirma": new Date().toLocaleString('es-DO', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(/\//g, '-')
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
    const { data: nuevoPago, error: insertErr } = await supabase
      .from('pagos')
      .insert({
        id_campana:      campana_id,
        paypal_order_id: order_id,
        monto:           parseFloat(monto.toFixed(2)),
        ncf,
        estado_dgii:     'Aceptado',
        metodo_pago:     'PayPal',
        rnc_cedula:      rnc_cedula ?? null,
        razon_social:    razon_social ?? null,
        tipo_comprobante: 'Factura de Consumo',
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
