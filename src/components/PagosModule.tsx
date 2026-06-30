import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Campaign } from '../types';
import QRCode from 'qrcode';
import {
  CreditCard, Plus, X, Save, Loader2, FileText,
  CheckCircle, Clock, XCircle, Download, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface Pago {
  id_pago: string; id_campana?: string; monto: number;
  itbis?: number; total_con_itbis?: number; ncf?: string;
  estado_dgii: string; metodo_pago: string;
  rnc_cedula?: string; razon_social?: string; fecha: string;
  nombre_campana?: string; url_dgii?: string;
}

const ESTADO_COLORS: Record<string, string> = {
  Aceptado:  'bg-emerald-100 text-emerald-700',
  Pendiente: 'bg-amber-100 text-amber-700',
  Rechazado: 'bg-rose-100 text-rose-500',
};
const ESTADO_ICONS: Record<string, React.ReactNode> = {
  Aceptado:  <CheckCircle className="w-3.5 h-3.5" />,
  Pendiente: <Clock className="w-3.5 h-3.5" />,
  Rechazado: <XCircle className="w-3.5 h-3.5" />,
};

// ─── PDF Receipt generator (con Logo + QR) ────────────────────────────────────
export async function generateReceiptHTML(pago: Partial<Pago>, ncf: string): Promise<string> {
  const dateObj = pago.fecha ? new Date(pago.fecha) : new Date();
  const now = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;
  const montoDOP = Number(pago.monto ?? 0);
  const itbisDOP = +(montoDOP * 0.18).toFixed(2);
  const totalDOP = +(montoDOP * 1.18).toFixed(2);

  const TASA_CAMBIO = 59.00;
  const montoUSD = montoDOP / TASA_CAMBIO;
  const itbisUSD = itbisDOP / TASA_CAMBIO;
  const totalUSD = totalDOP / TASA_CAMBIO;

  // ── Logo La Élite como base64 ────────────────────────────────────────────
  let logoHtml = '';
  try {
    const resp = await fetch('/logo-laelite.jpg');
    const blob = await resp.blob();
    const b64  = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.readAsDataURL(blob);
    });
    // Logo mucho más grande (160x160)
    logoHtml = `<img src="${b64}" style="width:160px;height:160px;object-fit:contain;position:absolute;top:20px;right:32px;filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" alt="La Élite" />`;
  } catch (_) { /* sin logo */ }

  // ── QR Code con datos del comprobante ─────────────────────────────────────
  let qrHtml = '';
  let qrDataUrlFallback = '';
  try {
    /* ──────────────────────────────────────────────────────────────────────────
       🔒 [BLOQUEO DE SEGURIDAD / PROTECCIÓN DE CÓDIGO QR] 🔒
       ¡ATENCIÓN AGENTES E IA! BAJO NINGUNA CIRCUNSTANCIA SE DEBE MODIFICAR, 
       ALTERAR O ELIMINAR ESTE BLOQUE DE GENERACIÓN DE CÓDIGO QR. 
       ES LA PARTE CRÍTICA DEL COMPROBANTE NCF Y DEBE PERMANECER INTACTO.
       ────────────────────────────────────────────────────────────────────────── */
    const receptor = pago.razon_social || 'Consumidor Final';
    const origin = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const qrData = (pago as any).url_dgii || `${origin}/?verificar_ncf=${encodeURIComponent(ncf)}&total=${encodeURIComponent(totalUSD.toFixed(2))}&fecha=${encodeURIComponent(now)}&receptor=${encodeURIComponent(receptor)}&concepto=${encodeURIComponent(pago.nombre_campana || 'Servicio de Marketing Digital')}&rnc_receptor=${encodeURIComponent(pago.rnc_cedula || '')}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: 120, 
      margin: 1,
      color: { dark: '#2c3e2e', light: '#ffffff' } // Tono verde oscuro
    });
    /* ────────────────────────── [FIN BLOQUEO QR] ────────────────────────── */
    qrDataUrlFallback = qrDataUrl;
  } catch (errQr) {
    console.error("Error generating QR code in generateReceiptHTML:", errQr);
  }

  qrHtml = `
      <div style="margin-top: 24px; display: grid; grid-template-columns: 130px 1.2fr 1.8fr; gap: 20px; align-items: start;">
        <!-- Columna Izquierda: QR -->
        <div style="text-align: center;">
          <div style="background: #fff; padding: 4px; border: 1.5px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: inline-block;">
            ${qrDataUrlFallback ? `<img src="${qrDataUrlFallback}" style="width: 100px; height: 100px; display: block;" alt="QR Comprobante" />` : '<div style="width:100px;height:100px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;">Sin QR</div>'}
          </div>
          <p style="font-size: 10px; color: #1e293b; margin: 8px 0 2px; font-weight: 700; letter-spacing: 0.5px;">VERIFICAR</p>
          <p style="font-size: 8px; color: #64748b; margin: 0; font-weight: 500; font-family: 'Inter', sans-serif;">DGII - E-NCF - VERIFICACIÓN</p>
        </div>

        <!-- Columna Central: Firma y Fecha -->
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 120px; padding-top: 5px;">
          <!-- Firma -->
          <div style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 50px;">
            <div style="width: 80%; border-bottom: 1.5px solid #94a3b8; margin: 4px 0 6px;"></div>
            <span style="font-size: 10px; color: #64748b; font-weight: 600;">Firma autorizada</span>
          </div>

          <!-- Fecha de Comprobante -->
          <div style="display: flex; align-items: center; gap: 8px; text-align: left; margin-top: 15px;">
            <!-- Icono de Calendario SVG -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <span style="font-size: 9px; color: #64748b; font-weight: 600; display: block; text-transform: uppercase;">Fecha del comprobante:</span>
              <strong style="font-size: 11px; color: #0f172a; font-weight: 700;">${now}</strong>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Cuadro Informativo -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; display: flex; gap: 12px; align-items: start; min-height: 100px; box-sizing: border-box;">
          <!-- Icono de Escudo de Seguridad SVG Verde -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="m9 11 2 2 4-4"></path>
          </svg>
          <div style="font-size: 10px; line-height: 1.5; color: #64748b; text-align: left;">
            <strong style="color: #0f172a; font-size: 11px; display: block; margin-bottom: 4px;">Documento generado electrónicamente</strong>
            Este comprobante ha sido generado por<br/>
            <strong style="color: #0f172a; font-weight: 600;">Marketdev S.A.S.</strong>
            <p style="margin: 8px 0 0; color: #64748b; font-weight: 500;">No requiere firma manuscrita.</p>
          </div>
        </div>
      </div>

      <!-- Estado de la DGII -->
      <div style="margin-top: 24px; padding: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: center; align-items: center; gap: 8px;">
        <span style="font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Estado DGII:</span>
        <div style="display: flex; align-items: center; gap: 6px; color: #10b981; font-weight: 700; font-size: 11px; text-transform: uppercase;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ACEPTADO
        </div>
      </div>

      <!-- Cuadro Autorización DGII (Se fuerza el salto de página antes para impresión limpia en página 2) -->
      <div style="margin-top: 40px; page-break-before: always;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; gap: 14px; align-items: center;">
          <!-- Icono de Edificio Institucional SVG -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="16"></line>
            <line x1="15" y1="22" x2="15" y2="16"></line>
            <line x1="9" y1="16" x2="15" y2="16"></line>
            <path d="M12 2v20"></path>
          </svg>
          <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: left;">
            <strong style="color: #0f172a; display: block; margin-bottom: 2px;">Autorizado por la Dirección General de Impuestos Internos (DGII).</strong>
            Para validar la información de este comprobante escanee el código QR o ingrese a <a href="https://www.dgii.gov.do" target="_blank" style="color: #2c3e2e; font-weight: 600; text-decoration: none;">www.dgii.gov.do</a>
          </div>
        </div>
      </div>`;

  return `
<!DOCTYPE html><html><head><title>Comprobante ${ncf}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #1e293b;
    padding: 40px;
    max-width: 800px;
    margin: auto;
    position: relative;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header-brand { margin-bottom: 30px; }
  h1 { font-size: 24px; margin: 0 0 4px; color: #0f172a; font-weight: 700; letter-spacing: -0.5px; }
  .brand-info { color: #64748b; font-size: 11px; line-height: 1.5; }
  
  .invoice-title {
    background: linear-gradient(135deg, #2c3e2e 0%, #1a251b 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin: 24px 0;
    display: inline-block;
  }
  .invoice-title h2 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
  
  .ncf-box {
    margin-bottom: 30px;
  }
  .ncf-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
  .ncf-value { font-size: 18px; font-weight: 700; color: #b8975a; letter-spacing: 1px; } /* Color dorado/gold */
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
  }
  .info-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
  }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { color: #64748b; font-weight: 500; }
  .info-value { color: #0f172a; font-weight: 600; text-align: right; }
  
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 10px; }
  th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
  th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; text-align: right; }
  td { padding: 14px 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  td:last-child { text-align: right; font-weight: 500; }
  
  .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 24px; }
  .totals-table { width: 320px; }
  .totals-table td { border: none; padding: 8px 12px; font-size: 12px; }
  .totals-table .totals-label { color: #64748b; font-weight: 500; text-align: left; }
  .totals-table .totals-value { color: #0f172a; font-weight: 600; text-align: right; }
  .totals-table .grand-total td { 
    background: #2c3e2e; 
    color: white; 
    font-size: 15px; 
    font-weight: 700; 
    padding: 14px 12px; 
    margin-top: 8px;
  }
  .totals-table .grand-total .totals-label { color: #e2e8f0; border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
  .totals-table .grand-total .totals-value { border-top-right-radius: 8px; border-bottom-right-radius: 8px; color: white; }
  
  .footer-line { border-top: 2px dashed #cbd5e1; margin-top: 40px; }
  
  @media print { 
    body { padding: 20px; } 
    .invoice-title { background: #2c3e2e !important; color: white !important; }
    .totals-table .grand-total td { background: #2c3e2e !important; color: white !important; }
  }
</style></head><body>
  ${logoHtml}
  
  <div class="header-brand">
    <h1>MARKETDEV S.A.S.</h1>
    <div class="brand-info">
      RNC: 1-31-00000-0<br/>
      Av. Winston Churchill, Torre Empresarial, Piso 10<br/>
      Santo Domingo, República Dominicana<br/>
      Tel: (809) 555-0199 | info@marketdev.do
    </div>
  </div>

  <div class="invoice-title">
    <h2>FACTURA DE CONSUMO ELECTRÓNICA</h2>
  </div>

  <div class="ncf-box">
    <div class="ncf-label">Comprobante Fiscal (e-NCF)</div>
    <div class="ncf-value">${ncf}</div>
  </div>
  
  <div class="info-grid">
    <div class="info-card">
      <div class="info-row"><span class="info-label">Receptor:</span><span class="info-value">${pago.razon_social ?? 'Consumidor Final'}</span></div>
      <div class="info-row"><span class="info-label">RNC / Cédula:</span><span class="info-value">${pago.rnc_cedula ?? '—'}</span></div>
      <div class="info-row"><span class="info-label">Tipo Ingreso:</span><span class="info-value">01 - Ingresos Operaciones</span></div>
    </div>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Fecha Emisión:</span><span class="info-value">${now}</span></div>
      <div class="info-row"><span class="info-label">Forma de Pago:</span><span class="info-value">${pago.metodo_pago ?? 'PayPal'}</span></div>
      <div class="info-row"><span class="info-label">Ambiente:</span><span class="info-value">Certificación DGII</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%">Línea</th>
        <th style="width:55%">Descripción del Servicio</th>
        <th style="width:10%">Cant.</th>
        <th style="width:15%">Precio Unit.</th>
        <th style="width:15%">Monto Neto</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:#64748b;font-weight:600;">01</td>
        <td>
          <div style="font-weight:600;color:#0f172a;margin-bottom:4px;">Servicio de Marketing Digital</div>
          <div style="font-size:11px;color:#64748b;">Campaña publicitaria: ${pago.nombre_campana ?? 'General'}</div>
        </td>
        <td style="text-align:center;">1</td>
        <td>USD $ ${montoUSD.toFixed(2)}</td>
        <td>USD $ ${montoUSD.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrapper" style="flex-direction:column; align-items:flex-end;">
    <table class="totals-table">
      <tr>
        <td class="totals-label">Monto Gravado:</td>
        <td class="totals-value">USD $ ${montoUSD.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="totals-label">ITBIS (18%):</td>
        <td class="totals-value">USD $ ${itbisUSD.toFixed(2)}</td>
      </tr>
      <tr class="grand-total">
        <td class="totals-label">TOTAL FACTURA</td>
        <td class="totals-value">USD $ ${totalUSD.toFixed(2)}</td>
      </tr>
    </table>
    <div style="text-align:right;margin-top:12px;font-size:11px;color:#64748b;font-weight:500;">
      Tasa de Cambio oficial: <strong>RD$ 59.00 / USD</strong><br/>
      Total Equivalente en Pesos: <strong>RD$ ${totalDOP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
    </div>
  </div>
  
  <div class="footer-line"></div>
  ${qrHtml}
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body></html>`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean; onClose: () => void; onSaved: () => void; campaigns: Campaign[];
}

const PagoModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, campaigns }) => {
  const { profile } = useUser();
  const [idCampana, setIdCampana]     = useState('');
  const [monto, setMonto]             = useState('');
  const [metodo, setMetodo]           = useState('PayPal');
  const [razonSocial, setRazonSocial] = useState('');
  const [rncCedula, setRncCedula]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!isOpen) { setIdCampana(''); setMonto(''); setMetodo('PayPal'); setRazonSocial(''); setRncCedula(''); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return setError('El monto debe ser mayor que cero.');
    setSaving(true);
    try {
      // Generate NCF via DB function
      const { data: ncfData } = await supabase.rpc('generar_ncf');
      const ncf = ncfData as string;
      const selectedCamp = campaigns.find(c => c.id === idCampana);

      const payload = {
        id_campana:      idCampana || null,
        monto:           Number(monto) * 59.00, // Almacenar en DOP aplicando tasa de cambio
        ncf,
        estado_dgii:     'Pendiente',
        metodo_pago:     metodo,
        rnc_cedula:      rncCedula || null,
        razon_social:    razonSocial || null,
        tipo_comprobante: 'Factura de Consumo',
        id_usuario:      profile?.id_usuario ?? null,
      };
      const { error: insertErr } = await supabase.from('pagos').insert([payload]);
      if (insertErr) throw insertErr;

      // Generate and open receipt PDF
      const html = await generateReceiptHTML({
        id_campana:   payload.id_campana   ?? undefined,
        monto:        payload.monto,
        ncf,
        metodo_pago:  payload.metodo_pago,
        rnc_cedula:   payload.rnc_cedula   ?? undefined,
        razon_social: payload.razon_social ?? undefined,
        nombre_campana: selectedCamp?.name,
        fecha:        new Date().toISOString(),
      }, ncf);
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }

      onSaved(); onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago.');
    } finally { setSaving(false); }
  };

  const cls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const lbl = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Registrar Pago</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}
          <div>
            <label className={lbl}>Campaña</label>
            <select value={idCampana} onChange={e => setIdCampana(e.target.value)} className={cls}>
              <option value="">Sin campaña específica</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Monto (USD) *</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} className={cls} required placeholder="0.00" />
            </div>
            <div>
              <label className={lbl}>Método de Pago</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)} className={cls}>
                {['PayPal','Transferencia','Tarjeta','Efectivo'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {monto && Number(monto) > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-500"><span>Monto base:</span><span>USD $ {Number(monto).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>ITBIS (18%):</span><span>USD $ {(Number(monto) * 0.18).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1"><span>Total:</span><span>USD $ {(Number(monto) * 1.18).toFixed(2)}</span></div>
            </div>
          )}
          <div>
            <label className={lbl}>Razón Social del Receptor</label>
            <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={cls} placeholder="Consumidor Final" />
          </div>
          <div>
            <label className={lbl}>RNC / Cédula</label>
            <input type="text" value={rncCedula} onChange={e => setRncCedula(e.target.value)} className={cls} placeholder="000-0000000-0" />
          </div>
          <div className="text-[10px] text-slate-400 bg-blue-50 border border-blue-100 rounded-xl p-3">
            ℹ️ Se generará automáticamente un NCF con formato dominicano (E31XXXXXXXXXX) y se abrirá el comprobante PDF para imprimir.
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Procesando...' : 'Confirmar y Generar NCF'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Module ──────────────────────────────────────────────────────────────
export const PagosModule: React.FC = () => {
  const { isMarketingOrAbove } = useUser();
  const [pagos, setPagos]           = useState<Pago[]>([]);
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase.from('pagos').select('*, campaigns(nombre_campana)').order('fecha', { ascending: false }),
      supabase.from('campaigns').select('id, nombre_campana, estado'),
    ]);
    if (ps) setPagos(ps.map((p: any) => ({ ...p, nombre_campana: p.campaigns?.nombre_campana })));
    if (cs) setCampaigns(cs.map((c: any) => ({ id: c.id, name: c.nombre_campana, channel: 'Multi', status: c.estado, leads: 0, ctr: 0, reach: '0', startDate: '' })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const totalIngresos = pagos.reduce((s, p) => s + (p.total_con_itbis ?? p.monto * 1.18), 0);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const chartData = monthNames.map((name, index) => {
    const pagosMes = pagos.filter(p => {
      const d = new Date(p.fecha);
      return d.getMonth() === index && d.getFullYear() === currentYear;
    });
    const monto = pagosMes.reduce((sum, p) => sum + (p.total_con_itbis ?? p.monto * 1.18), 0);
    return { name, monto };
  }).filter((_, index) => index <= currentDate.getMonth());

  const filteredPagos = pagos.filter(p => 
    p.ncf?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre_campana?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-800">Pagos y Comprobantes</h2>
          <p className="text-slate-500 text-sm">Gestión de cobros y comprobantes NCF (formato dominicano)</p>
        </div>
        {isMarketingOrAbove && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all">
            <Plus className="w-4 h-4" /> Registrar Pago
          </button>
        )}
      </div>

      {/* Dashboard Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Ingresos */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Ingresos Totales</h3>
            <p className="text-xs text-slate-500 mb-4">Total facturado con ITBIS</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                ${totalIngresos.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                style={{
                  background: `conic-gradient(#2563eb ${
                    pagos.length ? Math.round((pagos.filter(p => p.estado_dgii === 'Aceptado').length / (pagos.filter(p => p.estado_dgii === 'Aceptado').length + pagos.filter(p => p.estado_dgii === 'Pendiente').length || 1)) * 100) : 0
                  }%, #f1f5f9 0)`
                }}
                title={`Aceptados: ${pagos.filter(p => p.estado_dgii === 'Aceptado').length}\nPendientes: ${pagos.filter(p => p.estado_dgii === 'Pendiente').length}`}
              >
                <div className="w-12 h-12 bg-white rounded-full" />
              </div>
              <div className="text-xs text-slate-500 cursor-default">
                <div 
                  className="flex items-center gap-1.5 mb-1 hover:text-slate-800 transition-colors"
                  title={`${pagos.filter(p => p.estado_dgii === 'Aceptado').length} pagos aceptados`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600" /> Aceptado
                </div>
                <div 
                  className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
                  title={`${pagos.filter(p => p.estado_dgii === 'Pendiente').length} pagos pendientes`}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-200" /> Pendiente
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-500">{pagos.filter(p => p.estado_dgii === 'Pendiente').length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Pendientes</p>
            </div>
          </div>
        </div>

        {/* Bar Chart: Ingresos mensuales */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Ingresos mensuales</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">Este año</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="monto" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cuentas / Resumen UI */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 rounded-3xl p-7 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <span className="font-semibold tracking-widest text-xs opacity-80 uppercase">Cuenta Corporativa</span>
              <p className="font-bold text-lg mt-0.5">MarketIA S.A.S</p>
            </div>
            <div className="flex gap-1 opacity-90">
              <div className="w-7 h-7 bg-white/80 rounded-full mix-blend-screen" />
              <div className="w-7 h-7 bg-white/50 rounded-full mix-blend-screen -ml-4" />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="font-mono text-xl tracking-[0.15em] mb-4 text-white/90">TRANS. TOTALES: {pagos.length}</p>
            <div className="flex justify-between items-end text-xs">
              <div>
                <p className="text-white/60 mb-1 uppercase tracking-wider text-[10px]">RNC</p>
                <p className="font-semibold tracking-wider">1-31-00000-0</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 mb-1 uppercase tracking-wider text-[10px]">Estado DGII</p>
                <p className="font-semibold tracking-wider text-emerald-400">ACTIVO</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Depósitos recientes</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar NCF o empresa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No hay pagos registrados</p>
          </div>
        ) : filteredPagos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-semibold text-slate-500">No se encontraron pagos para "{searchTerm}"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['NCF','Campaña','Razón Social','Monto','ITBIS','Total','Método','Estado DGII','Fecha','Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPagos.map(p => (
                  <tr key={p.id_pago} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-[10px] font-bold text-violet-600 font-mono">{p.ncf ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.nombre_campana ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.razon_social || 'Consumidor Final'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">RD$ {Number(p.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">RD$ {(Number(p.monto) * 0.18).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">RD$ {(Number(p.monto) * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.metodo_pago}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${ESTADO_COLORS[p.estado_dgii] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ESTADO_ICONS[p.estado_dgii]} {p.estado_dgii}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">
                      {new Date(p.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button 
                        onClick={async () => {
                          const html = await generateReceiptHTML({
                            id_campana:   p.id_campana,
                            monto:        p.monto,
                            ncf:          p.ncf,
                            metodo_pago:  p.metodo_pago,
                            rnc_cedula:   p.rnc_cedula,
                            razon_social: p.razon_social,
                            nombre_campana: p.nombre_campana,
                            fecha:        p.fecha,
                            url_dgii:     (p as any).url_dgii,
                          }, p.ncf || '');
                          const win = window.open('', '_blank');
                          if (win) { 
                            win.document.write(html); 
                            win.document.close(); 
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-violet-600 hover:text-slate-900 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-200/50"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PagoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchAll} campaigns={campaigns} />
    </div>
  );
};
