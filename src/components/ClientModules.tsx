import { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, BarChart3, Users, MousePointerClick, User, Loader2, Search, Play, Square, RefreshCw, MessageSquare, AlertCircle, Save as SaveIcon, Heart, MessageCircle, Share2, Calendar } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateReceiptHTML } from './PagosModule';
import { getOpenWASessions, createOpenWASession, startOpenWASession, stopOpenWASession, getOpenWAQRCode } from '../lib/whatsapp';
import { getRecentMedia, getMediaInsights } from '../utils/instagramAnalytics';
import { Eye, X, Camera, ChevronLeft, ChevronRight, ArrowLeftRight, DollarSign, FileText } from 'lucide-react';
import { LearningDispatcher } from '../learning/services/LearningDispatcher';

// ==========================================
// MÓDULO DE PAGOS DEL CLIENTE
// ==========================================
export const ClientPagosModule = ({ campaigns, onPagar }: { campaigns: Campaign[], onPagar?: (c: Campaign) => void }) => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [dateTo, setDateTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const { profile } = useUser();

  const getStableNCF = (campaignId: string) => {
    const cleanId = campaignId.replace(/[^0-9]/g, '');
    const sequence = cleanId.substring(0, 10).padEnd(10, '0');
    return `E31${sequence}`;
  };

  useEffect(() => {
    const fetchPagos = async () => {
      setLoading(true);
      let clientRnc = '';
      let clientEmpresa = '';
      if (profile?.id_usuario) {
        clientRnc = localStorage.getItem(`client_rnc_${profile.id_usuario}`) || '';
        clientEmpresa = localStorage.getItem(`client_empresa_${profile.id_usuario}`) || '';
        try {
          const { data, error } = await supabase
            .from('clientes_portal')
            .select('rnc, empresa')
            .eq('auth_user_id', profile.id_usuario)
            .maybeSingle();
          if (data && !error) {
            clientRnc = data.rnc || clientRnc;
            clientEmpresa = data.empresa || clientEmpresa;
          }
        } catch (err) {
          console.warn("Table clientes_portal not found, using localStorage fallback for RNC.");
        }
      }
      const billingCampaigns = campaigns.filter(c => c.estado_moderacion !== 'rechazada');
      let dbPagos: any[] = [];
      if (billingCampaigns.length > 0) {
        const { data, error } = await supabase
          .from('pagos')
          .select('*')
          .in('id_campana', billingCampaigns.map(c => c.id));
        if (!error && data) {
          dbPagos = data;
        }
      }
      const formatPagos = billingCampaigns.map(c => {
        const dbPago = dbPagos.find(p => p.id_campana === c.id);
        const statusLower = (c.status || '').toLowerCase().trim();
        const isPending = statusLower === 'pendiente de pago' || statusLower === 'borrador';
        return {
          id: dbPago ? dbPago.id_pago : c.id,
          fecha: dbPago ? dbPago.fecha : (c.startDate || new Date().toISOString()),
          concepto: `Campaña: ${c.name}`,
          nombre_campana: c.name,
          monto: c.presupuesto || 0,
          estado: isPending ? 'Pendiente' : 'Aprobado',
          ncf: dbPago?.ncf || (isPending ? 'Pendiente' : getStableNCF(c.id)),
          metodo_pago: dbPago?.metodo_pago || (isPending ? 'Pendiente' : 'PayPal'),
          rnc_cedula: dbPago?.rnc_cedula || clientRnc || undefined,
          razon_social: dbPago?.razon_social || clientEmpresa || undefined,
          id_campana: c.id,
          url_dgii: dbPago?.url_dgii,
          rawCampaign: c
        };
      }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setPagos(formatPagos);
      setLoading(false);
    };
    fetchPagos();
    window.addEventListener('client-profile-updated', fetchPagos);
    return () => window.removeEventListener('client-profile-updated', fetchPagos);
  }, [campaigns, profile?.id_usuario]);

  const handleDownloadPDF = async (pago: any) => {
    try {
      const html = await generateReceiptHTML({
        id_campana:   pago.id_campana,
        monto:        pago.monto * 59.00,
        ncf:          pago.ncf,
        metodo_pago:  pago.metodo_pago || 'PayPal',
        rnc_cedula:   pago.rnc_cedula,
        razon_social: pago.razon_social,
        nombre_campana: pago.nombre_campana,
        fecha:        pago.fecha,
        url_dgii:     pago.url_dgii,
      }, pago.ncf);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      console.error("Error al generar PDF del recibo:", err);
      alert("No se pudo generar el comprobante PDF.");
    }
  };

  const totalInvertido = pagos.filter(p => p.estado === 'Aprobado').reduce((sum, p) => sum + (p.monto * 1.18), 0);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const chartData = monthNames.map((name, index) => {
    const pagosMes = pagos.filter(p => {
      const d = new Date(p.fecha);
      return p.estado === 'Aprobado' && d.getMonth() === index && d.getFullYear() === currentYear;
    });
    const monto = pagosMes.reduce((sum, p) => sum + (p.monto * 1.18), 0);
    return { name, monto };
  }).filter((_, index) => index <= currentDate.getMonth());

  const filtered = pagos.filter(p => {
    const matchText = p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || p.ncf.toLowerCase().includes(searchTerm.toLowerCase());
    const pFecha = new Date(p.fecha);
    const matchFrom = dateFrom ? pFecha >= new Date(dateFrom + 'T00:00:00') : true;
    const matchTo = dateTo ? pFecha <= new Date(dateTo + 'T23:59:59') : true;
    return matchText && matchFrom && matchTo;
  });
  const paginatedPagos = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Panel de Pagos</h2>
          <p className="text-slate-500">Administra tus métodos de pago, inversiones y comprobantes (e-CF).</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tour-pagos-cards-container">
        <div className="bg-transparent perspective-1000">
          <div className={`relative w-full h-full bg-white border border-slate-200 rounded-3xl shadow-sm transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            <div className="absolute inset-0 backface-hidden flex flex-col justify-between p-6">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-slate-800">Inversión Total</h3>
                  <button onClick={() => setIsFlipped(true)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors" title="Ver en DOP">
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">Balance de campañas pagadas</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">${totalInvertido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-sm font-bold text-emerald-500 mb-1">USD</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-l-violet-600 border-t-violet-600 transform -rotate-45 shrink-0" />
                <div className="text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-violet-600" /> PayPal</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200" /> Tarjeta</div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between p-6 bg-violet-50 rounded-3xl border border-violet-200">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-violet-900">Inversión Total</h3>
                  <button onClick={() => setIsFlipped(false)} className="p-1.5 rounded-full hover:bg-violet-200 text-violet-400 hover:text-violet-700 transition-colors" title="Ver en USD">
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-violet-500 mb-4">Balance convertido a pesos</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-violet-900 tracking-tight whitespace-nowrap">RD${(totalInvertido * 59.00).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="text-xs font-medium text-violet-600/80 bg-white/50 px-3 py-1.5 rounded-lg border border-violet-200/50">
                  Tasa estimada: RD$ 59.00 / USD
                </div>
              </div>
            </div>
            <div className="invisible p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold mb-1">Spacer</h3>
                <p className="text-xs mb-4">Spacer</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black tracking-tight">${totalInvertido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-16 h-16 shrink-0" />
                <div className="h-8" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Inversión mensual</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">Este año</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="monto" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="relative rounded-3xl p-6 flex flex-col justify-between overflow-hidden min-h-[200px] bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#4c1d95] shadow-xl shadow-violet-900/40">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-600/20 rounded-full blur-2xl pointer-events-none" />
          {/* Chip decorativo */}
          <div className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300/80 to-yellow-500/60 border border-yellow-200/40 shadow-inner flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-yellow-900/70" />
          </div>

          {/* Top: titular */}
          <div className="relative">
            <p className="text-[9px] font-bold text-violet-300/70 uppercase tracking-widest mb-2">Titular de la cuenta</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-black text-white">
                  {(profile?.nombre?.charAt(0) || 'C').toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight tracking-wide">
                  {profile?.nombre || 'Cliente'} {profile?.apellido || ''}
                </h3>
                <p className="text-[10px] text-violet-300/60 font-medium">{profile?.correo || ''}</p>
              </div>
            </div>
          </div>

          {/* Bottom: PayPal linked */}
          <div className="relative flex items-end justify-between mt-4">
            <div>
              <p className="text-[9px] text-violet-300/50 font-semibold uppercase tracking-widest mb-1">Método de pago</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#003087] rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-[10px]">P</span>
                </div>
                <span className="text-sm font-black text-white">PayPal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>
            </div>
            <span className="text-[9px] font-mono text-violet-300/40 tracking-widest">SECURE ✦</span>
          </div>
        </div>
      </div>

      <div id="tour-pagos-history" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Buscador texto */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar por concepto o NCF..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-700" />
            </div>
            {/* Filtro de fechas */}
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm flex-wrap sm:flex-nowrap">
              <Calendar className="w-4 h-4 text-violet-500 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer w-[110px] sm:w-[120px]"
                />
              </div>
              <span className="text-slate-300 text-sm font-bold mx-1 hidden sm:block">—</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(0); }}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer w-[110px] sm:w-[120px]"
                />
              </div>
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                className="ml-2 text-slate-400 hover:text-rose-500 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
                title="Limpiar filtro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <p className="text-[11px] text-violet-600 font-semibold">
              Mostrando {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{dateFrom ? ` desde ${new Date(dateFrom + 'T00:00:00').toLocaleDateString()}` : ''}{dateTo ? ` hasta ${new Date(dateTo + 'T00:00:00').toLocaleDateString()}` : ''}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4 text-right">Monto (USD)</th>
                <th className="p-4 text-right">Monto (DOP)</th>
                <th className="p-4 text-right">Con ITBIS 18%</th>
                <th className="p-4">NCF (e-CF)</th>
                <th className="p-4">Canal</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Cargando transacciones...</td>
                </tr>
              ) : paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">No hay pagos registrados.</td>
                </tr>
              ) : (
                paginatedPagos.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(p.fecha).toLocaleDateString()}</td>
                    <td className="p-4">{p.concepto}</td>
                    <td className="p-4 text-right font-bold text-slate-900">${(p.monto * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-semibold">USD</span></td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-900">RD${(p.monto * 59).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="block text-[10px] text-slate-400 font-semibold">DOP</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-900">RD${(p.monto * 59 * 1.18).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="block text-[10px] text-slate-400 font-semibold">Inc. ITBIS</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">{p.ncf}</td>
                    <td className="p-4 whitespace-nowrap">{p.metodo_pago}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {p.estado === 'Pendiente' && onPagar ? (
                          <button id="tour-pagos-table-pending" onClick={() => {
                            onPagar(p.rawCampaign);
                            LearningDispatcher.dispatch('UPDATE_UI_STATE', { currentModal: 'paymentModal' });
                            LearningDispatcher.dispatch('TRIGGER_ACTION', 'click_pay_campaign');
                          }} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm">Pagar</button>
                        ) : (
                          <>
                            <button id="tour-pagos-detail" onClick={() => setSelectedDetail(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" title="Ver Detalle Completo"><Eye className="w-4 h-4" /></button>
                            <button id="tour-pagos-download" onClick={() => handleDownloadPDF(p)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar Factura Electrónica (PDF)"><Download className="w-4 h-4" /></button>
                            {p.url_dgii && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                const url = p.url_dgii.startsWith('http') ? p.url_dgii : `https://${p.url_dgii}`;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors" title="Ver en DGII (Comprobante Fiscal)">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * pageSize >= filtered.length} className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Detalle de Publicación</h3>
                  <p className="text-xs text-slate-500 font-medium">Información completa del pago</p>
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Campaña Asociada</p>
                <p className="text-sm font-bold text-slate-800">{selectedDetail.nombre_campana}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    selectedDetail.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedDetail.estado}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{new Date(selectedDetail.fecha).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-violet-500" />
                  Desglose de Facturación
                </h4>
                
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monto Base</span>
                    <span className="font-semibold text-slate-700">${selectedDetail.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">ITBIS (18%)</span>
                    <span className="font-semibold text-slate-700">${(selectedDetail.monto * 0.18).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="h-px bg-slate-100 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Total a Pagar (USD)</span>
                    <span className="text-lg font-black text-violet-600">${(selectedDetail.monto * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-400">Total a Pagar (DOP)</span>
                    <span className="text-sm font-bold text-slate-800">RD$ {((selectedDetail.monto * 1.18) * 59).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {selectedDetail.ncf && selectedDetail.ncf !== 'Pendiente' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Comprobante Fiscal
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">NCF</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{selectedDetail.ncf}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">RNC/Cédula</span>
                      <span className="font-mono font-bold text-slate-800">{selectedDetail.rnc || 'Consumidor Final'}</span>
                    </div>
                    {selectedDetail.url_dgii && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const url = selectedDetail.url_dgii.startsWith('http') ? selectedDetail.url_dgii : `https://${selectedDetail.url_dgii}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="mt-3 w-full text-xs flex items-center justify-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Validar en la DGII
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <button onClick={() => setSelectedDetail(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors text-sm">Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// MÓDULO DE ESTADÍSTICAS DEL CLIENTE
// ==========================================
export const ClientEstadisticasModule = ({ campaigns }: { campaigns: any[] }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [realClicks, setRealClicks] = useState<number | null>(null);
  const [instagramPosts, setInstagramPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState<string>('7'); // '7', '14', '30', 'custom'
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const activeCamp = campaigns.filter(c => c.status === 'Activa').length;
  const totalReach = campaigns.reduce((acc, c) => acc + (parseInt(String(c.reach).replace(/\D/g, '')) || 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);

  const handleRangePresetChange = (preset: string) => {
    setDaysRange(preset);
    if (preset !== 'custom') {
      const numDays = parseInt(preset, 10);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (numDays - 1));
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      const campIds = campaigns.map(c => c.id);
      if (campIds.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      // Generate date range list
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysList: { date: string; count: number }[] = [];
      
      const curr = new Date(start);
      let limit = 0;
      while (curr <= end && limit < 365) {
        daysList.push({ date: curr.toISOString().split('T')[0], count: 0 });
        curr.setDate(curr.getDate() + 1);
        limit++;
      }

      const { data: pubs } = await supabase
        .from('publicaciones')
        .select('id_publicacion, fecha_publicacion')
        .in('id_campana', campIds);

      if (pubs) {
        pubs.forEach(pub => {
          if (pub.fecha_publicacion) {
            const pubDate = pub.fecha_publicacion.split('T')[0];
            const dayEntry = daysList.find(d => d.date === pubDate);
            if (dayEntry) dayEntry.count += 1;
          }
        });

        // Fetch real interactions from database
        let interactionsByDate: Record<string, number> = {};
        
        if (pubs.length > 0) {
          const { data: interaccionesData, error: intError } = await supabase
            .from('interacciones')
            .select('fecha, cantidad')
            .in('id_publicacion', pubs.map(p => p.id_publicacion));

          if (!intError && interaccionesData) {
            interaccionesData.forEach(int => {
              if (int.fecha) {
                const dateStr = int.fecha.split('T')[0];
                interactionsByDate[dateStr] = (interactionsByDate[dateStr] || 0) + (int.cantidad || 0);
              }
            });
          }
        }

        // Formatear fechas para el gráfico
        const formattedData = daysList.map(d => {
          const parts = d.date.split('-');
          const label = `${parts[2]}/${parts[1]}`;
          return {
            fecha: label,
            fullDate: d.date,
            publicaciones: d.count,
            interacciones: interactionsByDate[d.date] || 0
          };
        });
        
        setChartData(formattedData);
      }

      // 2. Fetch Real Link Analytics from Edge Function
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('publish_social', {
          body: { action: 'analytics_links' }
        });
        if (!edgeErr && edgeData?.status === 'success' && edgeData.analytics) {
          const links = edgeData.analytics;
          const totalLinkClicks = links.reduce((sum: number, link: any) => sum + (link.totalClicks || 0), 0);
          setRealClicks(totalLinkClicks);
        }
      } catch (e) {
        console.error("Error fetching link analytics", e);
      }

      // 3. Fetch Real Instagram Analytics (Meta Graph API)
      try {
        const recentMedia = await getRecentMedia(3);
        
        if (recentMedia && Array.isArray(recentMedia)) {
          const enrichedMedia = await Promise.all(
            recentMedia.map(async (media: any) => {
              try {
                const insights = await getMediaInsights(media.id);
                const sharesMetric = insights.find((m: any) => m.name === 'shares');
                return {
                  ...media,
                  shares_count: sharesMetric?.values[0]?.value || 0
                };
              } catch (e) {
                return { ...media, shares_count: 0 };
              }
            })
          );
          
          setInstagramPosts(enrichedMedia);
        }
      } catch (e) {
        console.error("Error fetching Instagram analytics", e);
      }

      setLoading(false);
    };

    fetchRealData();
  }, [campaigns, startDate, endDate]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Estadísticas y Resultados</h2>
        <p className="text-slate-500">Métricas en tiempo real basadas en la actividad de tu cuenta.</p>
      </div>

      <div id="tour-stats-kpi" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">Alcance Estimado</h3>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalReach > 0 ? (totalReach / 1000).toFixed(1) + 'K' : '0'}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">
             {realClicks !== null ? "Clics Reales en Enlaces" : "Interacciones Esperadas"}
          </h3>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {realClicks !== null ? realClicks : (totalReach * 0.05).toFixed(0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <ExternalLink className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">Conversiones (Leads)</h3>
          <div className="text-3xl font-bold text-slate-900 mt-1">{totalLeads}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-slate-500">Campañas Activas</h3>
          <div className="text-3xl font-bold text-slate-900 mt-1">{activeCamp}</div>
          <p className="text-xs text-slate-400 mt-2 font-medium">De {campaigns.length} totales</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-700">
              Actividad de Publicaciones {daysRange === '7' ? '(Últimos 7 días)' : daysRange === '14' ? '(Últimos 14 días)' : daysRange === '30' ? '(Últimos 30 días)' : ''}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtra la actividad de tus publicaciones por rango de fechas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRangePresetChange('7')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  daysRange === '7'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => handleRangePresetChange('14')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  daysRange === '14'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                14 días
              </button>
              <button
                type="button"
                onClick={() => handleRangePresetChange('30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  daysRange === '30'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                30 días
              </button>
              <button
                type="button"
                onClick={() => setDaysRange('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  daysRange === 'custom'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Personalizado
              </button>
            </div>

            {daysRange === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 animate-in fade-in duration-200">
                <Calendar className="w-4 h-4 text-violet-500 ml-1" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-slate-400 text-xs font-medium">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center h-[300px]">Cargando métricas...</div>
        ) : chartData.length > 0 && chartData.some(d => d.publicaciones > 0 || d.interacciones > 0) ? (
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="publicaciones" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Publicaciones Realizadas" />
                 <Bar dataKey="interacciones" fill="#ec4899" radius={[4, 4, 0, 0]} name="Interacciones" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        ) : (
           <div className="flex flex-col items-center justify-center min-h-[250px] text-center">
             <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
             <p className="text-slate-500">Aún no hay publicaciones en el rango seleccionado.</p>
           </div>
        )}
      </div>

      {/* SECCIÓN INSTAGRAM EN TIEMPO REAL */}
      <div id="tour-stats-ig" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rendimiento en Instagram</h3>
            <p className="text-xs text-slate-500">Métricas en tiempo real directamente desde Meta API</p>
          </div>
        </div>

        {instagramPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {instagramPosts.map((post) => (
              <div key={post.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 group hover:shadow-md transition-all">
                <div className="aspect-square bg-slate-200 relative overflow-hidden">
                  {post.media_type === 'VIDEO' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white relative">
                       <video src={post.media_url} className="w-full h-full object-cover opacity-80" muted loop playsInline />
                       <Play className="absolute w-12 h-12 text-white/70" />
                    </div>
                  ) : (
                    <img src={post.media_url} alt={post.caption || 'Publicación de Instagram'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 h-8">{post.caption}</p>
                  
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <Heart className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">{post.like_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">{post.comments_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm font-bold">{post.shares_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Camera className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No se encontraron publicaciones recientes o el token no está configurado.</p>
           </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MÓDULO DE PERFIL DEL CLIENTE (INTERACTIVO)
// ==========================================
export const ClientPerfilModule = () => {
  const { profile } = useUser();
  const [empresa, setEmpresa] = useState('');
  const [rnc, setRnc] = useState('');
  const [whatsappSessionName, setWhatsappSessionName] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const updateProfileEmpresa = (val: string) => {
    setEmpresa(val);
    LearningDispatcher.dispatch('UPDATE_UI_STATE', {
      formValues: { taxName: val }
    });
  };

  const updateProfileRnc = (val: string) => {
    setRnc(val);
    LearningDispatcher.dispatch('UPDATE_UI_STATE', {
      formValues: { taxRnc: val }
    });
  };

  useEffect(() => {
    LearningDispatcher.dispatch('UPDATE_UI_STATE', { 
      currentScreen: 'perfil'
    });
  }, []);

  const fetchSessionStatus = async () => {
    if (!whatsappSessionName) return;
    try {
      const list = await getOpenWASessions();
      const session = list.find(s => s.name === whatsappSessionName);
      setCurrentSession(session || null);
      if (session && session.status === 'qr_ready') {
        const qr = await getOpenWAQRCode(whatsappSessionName);
        setQrCodeData(qr);
      } else {
        setQrCodeData(null);
      }
    } catch (err) {
      // Silenciar logs de error del servicio OpenWA externo offline
    }
  };

  useEffect(() => {
    if (whatsappSessionName) {
      fetchSessionStatus();
      const timer = setInterval(() => {
        fetchSessionStatus();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [whatsappSessionName]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!profile?.id_usuario) return;
      const cachedEmpresa = localStorage.getItem(`client_empresa_${profile.id_usuario}`) || '';
      const cachedRnc = localStorage.getItem(`client_rnc_${profile.id_usuario}`) || '';
      const cachedSessionName = localStorage.getItem(`client_whatsapp_session_${profile.id_usuario}`) || `cli-session-${profile.id_usuario.substring(0, 8)}`;
      const cachedWhatsappPhone = localStorage.getItem(`client_whatsapp_phone_${profile.id_usuario}`) || '';
      setEmpresa(cachedEmpresa);
      setRnc(cachedRnc);
      setWhatsappSessionName(cachedSessionName);
      setWhatsappPhone(cachedWhatsappPhone);

      try {
        const { data, error } = await supabase
          .from('clientes_portal')
          .select('rnc, empresa, whatsapp_session_name, whatsapp_phone')
          .eq('auth_user_id', profile.id_usuario)
          .maybeSingle();
        if (data && !error) {
          setEmpresa(data.empresa || cachedEmpresa);
          setRnc(data.rnc || cachedRnc);
          setWhatsappSessionName(data.whatsapp_session_name || cachedSessionName);
          setWhatsappPhone(data.whatsapp_phone || cachedWhatsappPhone);
        }
      } catch (err) {
        console.warn("Table clientes_portal not found or columns missing, using localStorage fallback.");
      }
    };
    loadProfile();
  }, [profile?.id_usuario]);

  const handleSave = async () => {
    if (!profile?.id_usuario) return;
    setSaving(true);
    setMsg('');
    setError('');
    localStorage.setItem(`client_empresa_${profile.id_usuario}`, empresa);
    localStorage.setItem(`client_rnc_${profile.id_usuario}`, rnc);
    localStorage.setItem(`client_whatsapp_session_${profile.id_usuario}`, whatsappSessionName);
    localStorage.setItem(`client_whatsapp_phone_${profile.id_usuario}`, whatsappPhone);

    try {
      const payload: any = { empresa, rnc, whatsapp_session_name: whatsappSessionName, whatsapp_phone: whatsappPhone, updated_at: new Date().toISOString() };
      const { data: existing } = await supabase.from('clientes_portal').select('id_cliente').eq('auth_user_id', profile.id_usuario).maybeSingle();
      let result;
      if (existing) {
        result = await supabase.from('clientes_portal').update(payload).eq('auth_user_id', profile.id_usuario);
      } else {
        result = await supabase.from('clientes_portal').insert({ auth_user_id: profile.id_usuario, nombre: profile.nombre || 'Cliente', apellido: profile.apellido || '', email: profile.correo || '', ...payload });
      }
      if (result.error) {
        setMsg('¡Configuración guardada localmente con éxito!');
      } else {
        setMsg('¡Perfil y datos de facturación guardados con éxito!');
      }
    } catch {
      setMsg('¡Configuración guardada localmente con éxito!');
    } finally {
      setSaving(false);
      window.dispatchEvent(new Event('client-profile-updated'));
    }
  };

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/[^0-9]/g, '');
    if (digits.length === 10 && (digits.startsWith('809') || digits.startsWith('829') || digits.startsWith('849'))) {
      digits = '1' + digits;
    }
    setWhatsappPhone(digits);
  };

  const handleCreateAndStart = async () => {
    if (!whatsappSessionName) return;
    setActionLoading(true);
    setError('');
    try {
      const list = await getOpenWASessions();
      let session = list.find(s => s.name === whatsappSessionName);
      if (!session) {
        session = await createOpenWASession(whatsappSessionName);
      }
      if (!['ready', 'qr_ready', 'initializing', 'authenticating'].includes(session.status)) {
        await startOpenWASession(session.id);
      }
      await fetchSessionStatus();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la sesión de WhatsApp.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!whatsappSessionName) return;
    setActionLoading(true);
    setError('');
    try {
      const list = await getOpenWASessions();
      const session = list.find(s => s.name === whatsappSessionName);
      if (session) {
        await stopOpenWASession(session.id);
      }
      await fetchSessionStatus();
    } catch (err: any) {
      setError(err.message || 'Error al detener la sesión de WhatsApp.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-4xl font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.4)]">
          {profile?.nombre?.charAt(0) || 'U'}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{profile?.nombre} {profile?.apellido}</h2>
        <p className="text-slate-500">Cuenta de Cliente vinculada con Google</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px]" />
        {msg && <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</div>}
        {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</div>}

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" /> Datos de Facturación Fiscal (e-CF)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div id="tour-profile-empresa">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Razón Social / Nombre de la Empresa *</label>
              <input type="text" value={empresa} onChange={e => { updateProfileEmpresa(e.target.value); }} placeholder="Ej. Tabacalera del Caribe S.A.S." className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900" />
            </div>
            <div id="tour-profile-rnc">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">RNC o Cédula de Identidad *</label>
              <input type="text" value={rnc} onChange={e => { updateProfileRnc(e.target.value.replace(/[^0-9-]/g, '')); }} placeholder="Ej. 1-31-00000-0 o 001-0000000-0" className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900" />
            </div>
          </div>
          <div className="flex justify-end">
            <button id="tour-profile-save-billing" onClick={() => { 
              handleSave(); 
              LearningDispatcher.dispatch('UPDATE_UI_STATE', { taxSaved: true });
              LearningDispatcher.dispatch('TRIGGER_ACTION', 'click_save_billing'); 
            }} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar Datos de Facturación'}</span>
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" /> Configuración de WhatsApp Web (OpenWA)
          </h3>
          <p className="text-xs text-slate-500 mb-4">Vincule su propio número de WhatsApp para que los mensajes de marketing y alertas se envíen desde su cuenta de forma nativa.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div id="tour-profile-phone">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de Teléfono Vinculado *</label>
              <input type="text" value={whatsappPhone} onChange={e => { 
                handlePhoneChange(e.target.value); 
                LearningDispatcher.dispatch('UPDATE_UI_STATE', { 
                  formValues: { whatsappPhone: e.target.value } 
                });
              }} placeholder="Ej. 18095551234" className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de Sesión asignado</label>
              <input type="text" disabled value={whatsappSessionName} className="w-full px-4 py-2.5 text-xs font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none" />
            </div>
          </div>

          <div id="tour-profile-status" className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Conexión</p>
              <div className="flex items-center gap-2 mt-1">
                {currentSession ? (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    currentSession.status === 'ready' ? 'text-emerald-500 bg-emerald-100' :
                    currentSession.status === 'qr_ready' ? 'text-amber-500 bg-amber-100' : 'text-slate-500 bg-slate-100'
                  }`}>{currentSession.status === 'ready' ? 'Conectado' : currentSession.status === 'qr_ready' ? 'Esperando QR' : currentSession.status}</span>
                ) : <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">No Creada</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(!currentSession || currentSession.status === 'disconnected' || currentSession.status === 'created' || currentSession.status === 'failed') ? (
                <button id="tour-profile-connect-btn" onClick={() => { 
                  handleCreateAndStart(); 
                  LearningDispatcher.dispatch('UPDATE_UI_STATE', { whatsappConnected: true });
                  LearningDispatcher.dispatch('TRIGGER_ACTION', 'click_connect_whatsapp'); 
                }} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Vincular Dispositivo
                </button>
              ) : (
                <button id="tour-profile-connect-btn" onClick={handleStop} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />} Desconectar WhatsApp
                </button>
              )}
            </div>
          </div>

          {currentSession?.status === 'qr_ready' && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-5 text-xs space-y-4 mt-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-sm"><AlertCircle className="w-4 h-4 text-amber-500" /> Vinculación de WhatsApp requerida</p>
                <p>Por favor, escanea el código QR de la derecha utilizando tu teléfono móvil para activar la conexión de envíos:</p>
              </div>
              <div id="tour-profile-qr" className="w-44 h-44 bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                {qrCodeData ? <img src={qrCodeData} alt="WhatsApp QR Code" className="w-full h-full object-contain" /> : <Loader2 className="w-5 h-5 animate-spin text-slate-300" />}
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />
        <TelegramConfigClient />
      </div>
    </div>
  );
};

const TelegramConfigClient: React.FC = () => {
  const { profile } = useUser();
  const [destinos, setDestinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDestinos = async () => {
    setLoading(true);
    if (profile?.id_usuario) {
      const { data } = await supabase.from('telegram_destinos').select('*').eq('cliente_id', profile.id_usuario);
      setDestinos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDestinos();
  }, [profile]);

  const botUsername = 'Marketing_r_bot';

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5L2 12.5l7 2.5l3-2.5l-2.5 3l4 3.5L21 5z"></path></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Destinos de Telegram</h3>
            <p className="text-xs text-slate-400 mt-0.5">Vincula tu cuenta para recibir notificaciones y mensajes.</p>
          </div>
        </div>
        <button
          onClick={fetchDestinos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs space-y-3">
        <p className="font-bold text-blue-800">¿Cómo vincular tu cuenta de Telegram?</p>
        <p className="text-blue-700">Para vincular tu cuenta, sigue estos pasos:</p>
        <ol className="list-decimal list-inside space-y-2 ml-1 text-blue-800">
          <li>
            Haz clic en el siguiente enlace y luego en <strong>"Iniciar"</strong> (o "Start") dentro de Telegram:
            <br />
            {profile?.codigo_vinculacion_telegram && (
              <a 
                href={`https://t.me/${botUsername}?start=${profile.codigo_vinculacion_telegram}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex mt-1 items-center gap-1 text-blue-600 bg-blue-100/50 px-2 py-1 rounded font-mono font-bold hover:bg-blue-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                https://t.me/{botUsername}?start={profile.codigo_vinculacion_telegram}
              </a>
            )}
          </li>
          <li>Inmediatamente el bot te confirmará la vinculación y aparecerá en la lista de abajo.</li>
        </ol>
      </div>

      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Destinos Vinculados ({destinos.length})</h4>
        </div>
        {destinos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aún no has vinculado tu cuenta de Telegram.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {destinos.map((d, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {d.chat_title ? d.chat_title.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.chat_title || 'Usuario'}</p>
                    <p className="text-[10px] font-mono text-slate-400">ID: {d.chat_id}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">Activo</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


