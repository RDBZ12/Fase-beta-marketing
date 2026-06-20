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

// ─── PDF Receipt generator ────────────────────────────────────────────────────
function generateReceiptHTML(pago: Partial<Pago>, ncf: string): string {
  const now = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const monto = Number(pago.monto ?? 0);
  const itbis = +(monto * 0.18).toFixed(2);
  const total = +(monto * 1.18).toFixed(2);
  return `
<!DOCTYPE html><html><head><title>Comprobante ${ncf}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px;max-width:600px;margin:auto}
  h1{font-size:14px;text-align:center;margin-bottom:4px}
  .center{text-align:center} .bold{font-weight:bold}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#f3f4f6;padding:6px;border:1px solid #e5e7eb;text-align:left;font-size:10px}
  td{padding:6px;border:1px solid #e5e7eb;font-size:10px}
  .totals td{font-weight:bold}
  .ncf{font-size:13px;font-weight:bold;color:#5b21b6;text-align:center;margin:8px 0}
  hr{border:none;border-top:1px solid #e5e7eb;margin:10px 0}
</style></head><body>
  <div class="center">
    <h1>MARKETDEV S.A.S.</h1>
    <p>RNC: 1-31-00000-0 · Santo Domingo, RD · Tel: 809-000-0000</p>
    <h2 style="font-size:12px">FACTURA DE CONSUMO ELECTRÓNICA</h2>
    <p class="ncf">e-NCF: ${ncf}</p>
  </div>
  <hr/>
  <table>
    <tr><td class="bold">Receptor:</td><td>${pago.razon_social ?? 'Consumidor Final'}</td></tr>
    <tr><td class="bold">RNC/Cédula:</td><td>${pago.rnc_cedula ?? '—'}</td></tr>
    <tr><td class="bold">Campaña:</td><td>${pago.nombre_campana ?? '—'}</td></tr>
    <tr><td class="bold">Fecha emisión:</td><td>${now}</td></tr>
    <tr><td class="bold">Forma de pago:</td><td>${pago.metodo_pago ?? 'PayPal'}</td></tr>
    <tr><td class="bold">Ambiente:</td><td>TesteCF / Pruebas</td></tr>
  </table>
  <table style="margin-top:12px">
    <thead><tr><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio Unit.</th><th>Monto Neto</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Servicio de Marketing Digital — ${pago.nombre_campana ?? 'Campaña'}</td><td>1</td><td>RD$ ${monto.toFixed(2)}</td><td>RD$ ${monto.toFixed(2)}</td></tr>
    </tbody>
  </table>
  <table style="margin-top:8px">
    <tr class="totals"><td>Monto Gravado:</td><td style="text-align:right">RD$ ${monto.toFixed(2)}</td></tr>
    <tr class="totals"><td>ITBIS (18%):</td><td style="text-align:right">RD$ ${itbis.toFixed(2)}</td></tr>
    <tr class="totals" style="background:#ede9fe"><td class="bold">TOTAL FACTURA:</td><td style="text-align:right;font-size:13px">RD$ ${total.toFixed(2)}</td></tr>
  </table>
  <hr/>
  <p class="center" style="color:#6b7280;font-size:9px">Estado DGII: Pendiente · Este comprobante fue generado electrónicamente por Marketdev</p>
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
      const html = generateReceiptHTML({
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
