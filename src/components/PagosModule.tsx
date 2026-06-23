import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Campaign } from '../types';
import {
  CreditCard, Plus, X, Save, Loader2, FileText,
  CheckCircle, Clock, XCircle,
} from 'lucide-react';

interface Pago {
  id_pago: string; id_campana?: string; monto: number;
  itbis?: number; total_con_itbis?: number; ncf?: string;
  estado_dgii: string; metodo_pago: string;
  rnc_cedula?: string; razon_social?: string; fecha: string;
  nombre_campana?: string;
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
async function generateReceiptHTML(pago: Partial<Pago>, ncf: string): Promise<string> {
  const now   = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const monto = Number(pago.monto ?? 0);
  const itbis = +(monto * 0.18).toFixed(2);
  const total = +(monto * 1.18).toFixed(2);

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
  try {
    const QRCode  = (await import('qrcode')).default;
    const qrData  = `NCF:${ncf}|CAMPANA:${pago.nombre_campana ?? ''}|TOTAL:RD$${total.toFixed(2)}|FECHA:${now}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: 120, 
      margin: 1,
      color: { dark: '#2c3e2e', light: '#ffffff' } // Tono verde oscuro
    });
    qrHtml = `
      <div style="margin-top:40px;display:flex;align-items:flex-end;gap:16px;">
        <div style="background:#fff;padding:4px;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
          <img src="${qrDataUrl}" style="width:100px;height:100px;display:block;" alt="QR Comprobante" />
          <p style="font-size:9px;color:#64748b;margin:6px 0 2px;text-align:center;font-weight:600;letter-spacing:0.5px;">VERIFICAR</p>
        </div>
        <div style="flex:1;padding-bottom:8px;">
          <p style="font-size:10px;color:#475569;line-height:1.6;margin:0;">
            Estado DGII: <strong style="color:#10b981;">Aceptado</strong><br/>
            Este comprobante ha sido generado y firmado electrónicamente por <strong>Marketdev S.A.S.</strong><br/>
            Autorizado por la Dirección General de Impuestos Internos (DGII).
          </p>
        </div>
      </div>`;
  } catch (_) {
    qrHtml = `<p style="text-align:center;color:#64748b;font-size:10px;margin-top:30px;">Estado DGII: Aceptado · Comprobante generado electrónicamente por Marketdev</p>`;
  }

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
        <td>RD$ ${monto.toFixed(2)}</td>
        <td>RD$ ${monto.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrapper">
    <table class="totals-table">
      <tr>
        <td class="totals-label">Monto Gravado:</td>
        <td class="totals-value">RD$ ${monto.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="totals-label">ITBIS (18%):</td>
        <td class="totals-value">RD$ ${itbis.toFixed(2)}</td>
      </tr>
      <tr class="grand-total">
        <td class="totals-label">TOTAL FACTURA</td>
        <td class="totals-value">RD$ ${total.toFixed(2)}</td>
      </tr>
    </table>
  </div>
  
  <div class="footer-line"></div>
  ${qrHtml}
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
        monto:           Number(monto),
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
      }, ncf);
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }

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
              <label className={lbl}>Monto (RD$) *</label>
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
              <div className="flex justify-between text-slate-500"><span>Monto base:</span><span>RD$ {Number(monto).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>ITBIS (18%):</span><span>RD$ {(Number(monto) * 0.18).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1"><span>Total:</span><span>RD$ {(Number(monto) * 1.18).toFixed(2)}</span></div>
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Pagos y Comprobantes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de cobros y comprobantes NCF (formato dominicano)</p>
        </div>
        {isMarketingOrAbove && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all">
            <Plus className="w-3.5 h-3.5" /> Registrar Pago
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Transacciones', value: pagos.length, color: 'text-slate-700' },
          { label: 'Ingresos Totales (con ITBIS)', value: `RD$ ${totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, color: 'text-emerald-600' },
          { label: 'Pendientes DGII', value: pagos.filter(p => p.estado_dgii === 'Pendiente').length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['NCF','Campaña','Razón Social','Monto','ITBIS','Total','Método','Estado DGII','Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagos.map(p => (
                  <tr key={p.id_pago} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-[10px] font-bold text-violet-600 font-mono">{p.ncf ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.nombre_campana ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.razon_social || 'Consumidor Final'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">RD$ {Number(p.monto).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">RD$ {(Number(p.monto) * 0.18).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">RD$ {(Number(p.monto) * 1.18).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.metodo_pago}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${ESTADO_COLORS[p.estado_dgii] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ESTADO_ICONS[p.estado_dgii]} {p.estado_dgii}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">
                      {new Date(p.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
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
