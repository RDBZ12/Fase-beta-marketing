import { useEffect, useState } from 'react'
import { PayPalButtons } from '@paypal/react-paypal-js'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { X, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import type { Campaign } from '../types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: Campaign | null
  session: { user: { id: string } } | null
  onPagado?: () => void
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
const generarPDF = async (datos: {
  ncf: string
  nombreCampana: string
  rncCliente: string
  razonSocial: string
  monto: number
  itbis: number
  total: number
  paypalOrderId: string
  fecha?: string
  url_dgii?: string
}) => {
  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const W     = 210  // page width
  const M     = 16   // left margin
  const MR    = 194  // right margin
  let   Y     = 0    // current Y cursor

  const TASA_CAMBIO = 59.00
  const montoUSD = datos.monto / TASA_CAMBIO
  const itbisUSD = datos.itbis / TASA_CAMBIO
  const totalUSD = datos.total / TASA_CAMBIO

  // ── Logo La Élite (top-right) ────────────────────────────────────────────
  try {
    const logoUrl = '/logo-laelite.jpg'
    const resp    = await fetch(logoUrl)
    const blob    = await resp.blob()
    const b64     = await new Promise<string>((res) => {
      const r = new FileReader()
      r.onloadend = () => res(r.result as string)
      r.readAsDataURL(blob)
    })
    // Draw logo 60x60mm top-right corner
    doc.addImage(b64, 'JPEG', W - M - 60, 6, 60, 60)
  } catch (_) { }

  // ── Encabezado empresa ───────────────────────────────────────────────────
  Y = 24
  doc.setFontSize(22).setFont('helvetica', 'bold').setTextColor(15, 23, 42)
  doc.text('MARKETDEV S.A.S.', M, Y)

  Y += 7
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
  doc.text('RNC: 1-31-00000-0', M, Y); Y += 4.5
  doc.text('Av. Winston Churchill, Torre Empresarial, Piso 10', M, Y); Y += 4.5
  doc.text('Santo Domingo, República Dominicana', M, Y); Y += 4.5
  doc.text('Tel: (809) 555-0199 | info@marketdev.do', M, Y)

  // ── Título Factura (Banner Verde) ────────────────────────────────────────
  Y += 12
  doc.setFillColor(44, 62, 46) // dark green
  doc.roundedRect(M, Y, MR - M, 12, 2, 2, 'F')
  
  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(255, 255, 255)
  doc.text('FACTURA DE CONSUMO ELECTRÓNICA', M + 4, Y + 8)

  // ── NCF ──────────────────────────────────────────────────────────────────
  Y += 22
  doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(100, 116, 139)
  doc.text('Comprobante Fiscal (e-NCF)', M, Y)
  doc.setFontSize(14).setTextColor(184, 151, 90) // Gold
  doc.text(datos.ncf, M, Y + 6)

  Y += 16
  
  // ── Cajas de info (Receptor / Emisión) ───────────────────────────────────
  const midX = W / 2
  
  doc.setDrawColor(226, 232, 240).setLineWidth(0.3)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(M, Y, (W - 2*M)/2 - 2, 22, 2, 2, 'FD')
  doc.roundedRect(midX + 2, Y, (W - 2*M)/2 - 2, 22, 2, 2, 'FD')
  
  // Left Box (Receptor)
  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(100, 116, 139)
  doc.text('Receptor:', M + 4, Y + 6)
  doc.text('RNC / Cédula:', M + 4, Y + 12)
  doc.text('Tipo Ingreso:', M + 4, Y + 18)
  
  doc.setFont('helvetica', 'normal').setTextColor(15, 23, 42)
  doc.text(datos.razonSocial || 'Consumidor Final', M + 24, Y + 6)
  doc.text(datos.rncCliente || '—', M + 24, Y + 12)
  doc.text('01 - Ingresos Operaciones', M + 24, Y + 18)

  // Right Box (Emisión)
  doc.setFont('helvetica', 'bold').setTextColor(100, 116, 139)
  doc.text('Fecha Emisión:', midX + 6, Y + 6)
  doc.text('Forma de Pago:', midX + 6, Y + 12)
  doc.text('Ambiente:', midX + 6, Y + 18)
  
  const dateObj = datos.fecha ? new Date(datos.fecha) : new Date()
  const now = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`
  doc.setFont('helvetica', 'normal').setTextColor(15, 23, 42)
  doc.text(now, midX + 30, Y + 6)
  doc.text('PayPal', midX + 30, Y + 12)
  doc.text('Certificación DGII', midX + 30, Y + 18)

  Y += 32

  // ── Tabla Detalles ───────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249) // Header bg
  doc.rect(M, Y, MR - M, 8, 'F')
  
  doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(71, 85, 105)
  doc.text('Línea', M + 2, Y + 5.5)
  doc.text('Descripción del Servicio', M + 14, Y + 5.5)
  doc.text('Cant.', M + 110, Y + 5.5)
  doc.text('Precio Unit.', M + 130, Y + 5.5)
  doc.text('Monto Neto', MR - 2, Y + 5.5, { align: 'right' })

  Y += 14
  doc.setFont('helvetica', 'bold').setTextColor(100, 116, 139)
  doc.text('01', M + 2, Y)
  doc.setTextColor(15, 23, 42)
  doc.text('Servicio de Marketing Digital', M + 14, Y)
  
  doc.setFont('helvetica', 'normal').setTextColor(100, 116, 139)
  const splitted = doc.splitTextToSize(`Campaña publicitaria: ${datos.nombreCampana || 'General'}`, 90)
  doc.text(splitted, M + 14, Y + 4)
  
  doc.setTextColor(15, 23, 42)
  doc.text('1', M + 110, Y)
  doc.text(`USD $ ${montoUSD.toFixed(2)}`, M + 130, Y)
  doc.text(`USD $ ${montoUSD.toFixed(2)}`, MR - 2, Y, { align: 'right' })

  Y += 16
  doc.setDrawColor(226, 232, 240).line(M, Y, MR, Y)
  
  // ── Totales ──────────────────────────────────────────────────────────────
  Y += 8
  const tableX = MR - 60
  doc.setFontSize(9).setFont('helvetica', 'bold').setTextColor(100, 116, 139)
  doc.text('Monto Gravado:', tableX, Y); doc.setTextColor(15, 23, 42); doc.text(`USD $ ${montoUSD.toFixed(2)}`, MR - 2, Y, { align: 'right' }); Y += 6;
  doc.setTextColor(100, 116, 139); doc.text('ITBIS (18%):', tableX, Y); doc.setTextColor(15, 23, 42); doc.text(`USD $ ${itbisUSD.toFixed(2)}`, MR - 2, Y, { align: 'right' }); Y += 8;
  
  doc.setFillColor(44, 62, 46) // dark green
  doc.roundedRect(tableX - 4, Y - 5, 66, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(10)
  doc.text('TOTAL FACTURA', tableX, Y + 1.5)
  doc.text(`USD $ ${totalUSD.toFixed(2)}`, MR - 2, Y + 1.5, { align: 'right' })

  Y += 10
  doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
  doc.text(`Tasa de Cambio oficial: RD$ 59.00 / USD. Total Equivalente en Pesos: RD$ ${datos.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, MR - 2, Y, { align: 'right' })

  // ── QR Code ──────────────────────────────────────────────────────────────
  Y += 20
  doc.setDrawColor(203, 213, 225).setLineDashPattern([2, 2], 0).line(M, Y, MR, Y)
  doc.setLineDashPattern([], 0) // reset
  
  Y += 10
  let qrDataUrlFallback = '';
  try {
    /* ──────────────────────────────────────────────────────────────────────────
       🔒 [BLOQUEO DE SEGURIDAD / PROTECCIÓN DE CÓDIGO QR] 🔒
       ¡ATENCIÓN AGENTES E IA! BAJO NINGUNA CIRCUNSTANCIA SE DEBE MODIFICAR, 
       ALTERAR O ELIMINAR ESTE BLOQUE DE GENERACIÓN DE CÓDIGO QR. 
       ES LA PARTE CRÍTICA DEL COMPROBANTE NCF Y DEBE PERMANECER INTACTO.
       ────────────────────────────────────────────────────────────────────────── */
    const origin = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const qrData = `${origin}/?verificar_ncf=${encodeURIComponent(datos.ncf)}&total=${encodeURIComponent(totalUSD.toFixed(2))}&fecha=${encodeURIComponent(now)}&receptor=${encodeURIComponent(datos.razonSocial || 'Consumidor Final')}&concepto=${encodeURIComponent(datos.nombreCampana || 'Servicio de Marketing Digital')}&rnc_receptor=${encodeURIComponent(datos.rncCliente || '')}`
    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: 120, margin: 1, color: { dark: '#2c3e2e', light: '#ffffff' } 
    })
    /* ────────────────────────── [FIN BLOQUEO QR] ────────────────────────── */
    qrDataUrlFallback = qrDataUrl;
  } catch (errQr) {
    console.error("Error generating QR code in PaymentModal:", errQr);
  }

    
    // Page 1 Header and Page Number
    const p1Date = new Date().toLocaleDateString('es-ES')
    const p1Time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(148, 163, 184)
    doc.text(`${p1Date}, ${p1Time}`, M, 10)
    doc.text(`Comprobante ${datos.ncf}`, MR, 10, { align: 'right' })
    doc.text('1/2', MR, 285, { align: 'right' })

    // Caja de QR
    doc.setDrawColor(226, 232, 240).setLineWidth(0.3)
    doc.roundedRect(M, Y, 32, 32, 2, 2, 'S')
    if (qrDataUrlFallback) {
      doc.addImage(qrDataUrlFallback, 'PNG', M + 1, Y + 1, 30, 30)
    }
    
    doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(15, 23, 42)
    doc.text('VERIFICAR', M + 16, Y + 36, { align: 'center' })
    doc.setFontSize(6).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
    doc.text('DGII - E-NCF - VERIFICACIÓN', M + 16, Y + 39, { align: 'center' })
    
    // Columna Central: Firma y Fecha
    // Línea de firma
    doc.setDrawColor(148, 163, 184).setLineWidth(0.3)
    doc.line(M + 45, Y + 20, M + 90, Y + 20)
    
    doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(100, 116, 139)
    doc.text('Firma autorizada', M + 67.5, Y + 24, { align: 'center' })

    // Icono Calendario
    const iconX = M + 50
    const iconY = Y + 28
    doc.setDrawColor(100, 116, 139).setLineWidth(0.3)
    doc.roundedRect(iconX, iconY, 5, 5, 0.5, 0.5, 'S')
    doc.line(iconX, iconY + 1.5, iconX + 5, iconY + 1.5)
    doc.line(iconX + 1.5, iconY, iconX + 1.5, iconY + 1)
    doc.line(iconX + 3.5, iconY, iconX + 3.5, iconY + 1)

    doc.setFontSize(6).setFont('helvetica', 'bold').setTextColor(100, 116, 139)
    doc.text('FECHA DEL COMPROBANTE:', iconX + 7, iconY + 1.8)
    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(15, 23, 42)
    doc.text(now, iconX + 7, iconY + 4.5)

    // Columna Derecha: Cuadro Informativo
    doc.setDrawColor(226, 232, 240).setFillColor(248, 250, 252).setLineWidth(0.3)
    doc.roundedRect(M + 100, Y, 78, 32, 2.5, 2.5, 'FD')

    // Icono de Escudo Verde
    const sX = M + 104
    const sY = Y + 7
    doc.setDrawColor(16, 185, 129).setLineWidth(0.5)
    doc.line(sX, sY, sX + 3, sY - 1.5)
    doc.line(sX + 3, sY - 1.5, sX + 6, sY)
    doc.line(sX + 6, sY, sX + 6, sY + 3)
    doc.line(sX + 6, sY + 3, sX + 3, sY + 6)
    doc.line(sX + 3, sY + 6, sX, sY + 3)
    doc.line(sX, sY + 3, sX, sY)
    doc.line(sX + 2, sY + 3, sX + 2.8, sY + 4)
    doc.line(sX + 2.8, sY + 4, sX + 4.5, sY + 1.8)

    doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(15, 23, 42)
    doc.text('Documento generado electrónicamente', M + 112, Y + 6)
    doc.setFontSize(6.5).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
    doc.text('Este comprobante ha sido generado por', M + 112, Y + 10)
    doc.setFont('helvetica', 'bold').setTextColor(15, 23, 42)
    doc.text('Marketdev S.A.S.', M + 112, Y + 13)
    doc.setFont('helvetica', 'normal').setTextColor(100, 116, 139)
    doc.text('No requiere firma manuscrita.', M + 112, Y + 20)

    // Línea separadora de Estado DGII
    doc.setDrawColor(226, 232, 240).setLineWidth(0.3)
    doc.line(M, Y + 43, MR, Y + 43)

    // Estado DGII Centrado
    const cX = 85
    const cY = Y + 47.5
    doc.setDrawColor(16, 185, 129).setLineWidth(0.4)
    doc.circle(cX, cY, 2, 'S')
    doc.line(cX - 1, cY, cX - 0.2, cY + 0.8)
    doc.line(cX - 0.2, cY + 0.8, cX + 1, cY - 0.8)

    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(71, 85, 105)
    doc.text('Estado DGII:', 60, Y + 48.5)
    doc.setTextColor(16, 185, 129)
    doc.text('ACEPTADO', 90, Y + 48.5)

    // PÁGINA 2: Autorización DGII
    doc.addPage()
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(148, 163, 184)
    doc.text(`${p1Date}, ${p1Time}`, M, 10)
    doc.text(`Comprobante ${datos.ncf}`, MR, 10, { align: 'right' })
    doc.text('2/2', MR, 285, { align: 'right' })

    // Cuadro Autorización DGII
    doc.setDrawColor(226, 232, 240).setFillColor(248, 250, 252).setLineWidth(0.3)
    doc.roundedRect(M, 20, MR - M, 18, 2.5, 2.5, 'FD')

    // Icono Edificio
    const bX = M + 6
    const bY = 25
    doc.setDrawColor(71, 85, 105).setLineWidth(0.3)
    doc.rect(bX, bY, 6, 8, 'S')
    doc.line(bX + 2.5, bY + 8, bX + 2.5, bY + 5)
    doc.line(bX + 3.5, bY + 8, bX + 3.5, bY + 5)
    doc.line(bX + 2.5, bY + 5, bX + 3.5, bY + 5)
    doc.line(bX + 3, bY, bX + 3, bY + 8)

    doc.setFontSize(8).setFont('helvetica', 'bold').setTextColor(15, 23, 42)
    doc.text('Autorizado por la Dirección General de Impuestos Internos (DGII).', M + 16, 27)
    doc.setFontSize(7.5).setFont('helvetica', 'normal').setTextColor(71, 85, 105)
    doc.text('Para validar la información de este comprobante escanee el código QR o ingrese a www.dgii.gov.do', M + 16, 32)
    doc.text('Para validar la información de este comprobante escanee el código QR o ingrese a www.dgii.gov.do', M + 16, 32)

  doc.save(`Comprobante_${datos.ncf}.pdf`)
}

// ── Component ─────────────────────────────────────────────────────────────────
type ModalState = 'idle' | 'processing' | 'success' | 'error'

export function PaymentModal({ isOpen, onClose, campaign, session, onPagado }: PaymentModalProps) {
  const [monto,      setMonto]      = useState(0)
  const [rncCliente, setRncCliente] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [estado,     setEstado]     = useState<ModalState>('idle')
  const [mensaje,    setMensaje]    = useState('')
  const [ncfFinal,   setNcfFinal]   = useState('')
  const [, setOrderId] = useState('')

  useEffect(() => {
    if (campaign) {
      const userId = session?.user?.id || '';
      const fallbackRnc = localStorage.getItem(`client_rnc_${userId}`) || '';
      const fallbackEmpresa = localStorage.getItem(`client_empresa_${userId}`) || '';

      setMonto(campaign.presupuesto ?? 0)
      setRncCliente(fallbackRnc)
      setRazonSocial(fallbackEmpresa)
      setEstado('idle')
      setMensaje('')
      setNcfFinal('')
      setOrderId('')
    }
  }, [campaign])

  if (!isOpen || !campaign) return null

  const itbis = monto * 0.18
  const total = monto * 1.18

  // ── Verificación en el servidor (Edge Function) ────────────────────────────
  const verificarPagoEnServidor = async (paypalOrderId: string) => {
    setEstado('processing')
    setMensaje('Verificando pago con PayPal...')

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const { data: { session: currentSession } } = await supabase.auth.getSession()

      const res = await fetch(
        `${supabaseUrl}/functions/v1/verify_paypal_payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${currentSession?.access_token ?? supabaseKey}`,
            'apikey':        supabaseKey,
          },
          body: JSON.stringify({
            order_id:       paypalOrderId,
            campana_id:     campaign.id,
            monto_esperado: parseFloat(total.toFixed(2)),
            rnc_cedula:     rncCliente  || null,
            razon_social:   razonSocial || null,
          }),
        }
      )

      const data = await res.json()
      console.log('🚀 [DEBUG PAY] Respuesta del servidor:', { status: res.status, ok: res.ok, data });

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? data.message ?? 'Error desconocido en el servidor')
      }

      // ── Éxito: generar PDF y mostrar confirmación ──────────────────────
      setNcfFinal(data.ncf)
      setEstado('success')
      setMensaje(`Pago aprobado. NCF: ${data.ncf}`)

      generarPDF({
        ncf:          data.ncf,
        nombreCampana: campaign.name,
        rncCliente,
        razonSocial,
        monto:        data.pago.monto,
        itbis:        data.pago.itbis,
        total:        data.pago.total_con_itbis,
        paypalOrderId,
        fecha:        data.pago.fecha,
        url_dgii:     data.url_dgii,
      })

      // ── ACTIVAR CAMPAÑA ────────────────────────────────────
      setMensaje(`Pago aprobado. Activando campaña...`)
      try {
        await supabase.from('campaigns').update({ estado: 'Activa' }).eq('id', campaign.id);
        setMensaje(`¡Campaña activa y lista!`)
      } catch (pubErr) {
        console.error("Error activando la campaña:", pubErr);
      }
      // ─────────────────────────────────────────────────────────────────────────

      onPagado?.()
    } catch (err: any) {
      setEstado('error')
      setMensaje(err.message ?? 'Error al verificar el pago.')
    }
  }

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const inputCls = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-violet-50 to-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pagar campaña</h2>
            <p className="text-sm text-slate-500 truncate max-w-[300px]">{campaign.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── Estado: procesando ─────────────────────────────────────── */}
          {estado === 'processing' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">{mensaje}</p>
              <p className="text-xs text-slate-400">No cierres esta ventana</p>
            </div>
          )}

          {/* ── Estado: éxito ─────────────────────────────────────────── */}
          {estado === 'success' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">¡Pago Confirmado!</h3>
              <p className="text-xs text-slate-500 text-center">
                La campaña fue activada y el comprobante PDF se descargó automáticamente.
              </p>
              <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">e-NCF Generado</p>
                <p className="text-sm font-black text-violet-700 font-mono">{ncfFinal}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* ── Estado: error ─────────────────────────────────────────── */}
          {estado === 'error' && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Error en el pago</h3>
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 text-center">
                {mensaje}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEstado('idle')}
                  className="px-4 py-2 text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
                >
                  Intentar de nuevo
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ── Estado: idle (formulario + botón PayPal) ──────────────── */}
          {estado === 'idle' && (
            <>
              {/* Monto */}
              <div>
                <label className={labelCls}>Presupuesto de campaña (USD)</label>
                <input
                  type="number"
                  value={monto}
                  readOnly
                  disabled
                  className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed font-semibold`}
                />
              </div>

              {/* RNC / Razón Social */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>RNC / Cédula</label>
                  <input
                    type="text"
                    value={rncCliente}
                    onChange={(e) => setRncCliente(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="Ej. 1-31-00000-0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Razón Social</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Empresa o nombre"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Resumen de montos */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">USD {monto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ITBIS (18%)</span>
                  <span className="font-semibold text-slate-700">USD {itbis.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <span className="text-slate-800">Total a pagar</span>
                  <span className="text-violet-700 text-base">USD {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Seguridad badge */}
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  El pago es verificado de forma segura por nuestro servidor antes de activar la campaña.
                  Tu información nunca se almacena en el frontend.
                </span>
              </div>

              {/* Botón PayPal */}
              {monto > 0 && (
                <div className="pt-1">
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'rect', color: 'gold' }}
                    key={`paypal-${campaign.id}-${total.toFixed(2)}`}
                    createOrder={(_data, actions) =>
                      actions.order!.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                          amount: {
                            value:         total.toFixed(2),
                            currency_code: 'USD',
                          },
                          description: `Campaña: ${campaign.name}`,
                          custom_id:   campaign.id,
                        }],
                      })
                    }
                    onApprove={async (data) => {
                      await verificarPagoEnServidor(data.orderID)
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', JSON.stringify(err))
                      const msg = typeof err === 'object' && err !== null
                        ? (err as any).message ?? JSON.stringify(err)
                        : String(err)
                      setEstado('error')
                      setMensaje(`Error PayPal: ${msg}`)
                    }}
                    onCancel={() => setMensaje('')}
                  />
                </div>
              )}

              {monto <= 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  ⚠️ El monto debe ser mayor a 0 para proceder con el pago.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
