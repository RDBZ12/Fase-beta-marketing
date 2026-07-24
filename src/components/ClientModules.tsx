// src/components/ClientModules.tsx (Parcial: Restauración de Perfil con Tour ID interactivo)
import { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, BarChart3, Users, MousePointerClick, User, Shield, CheckCircle2, Save, Loader2, Search, Play, Square, RefreshCw, MessageSquare, AlertCircle, MessageSquare as MessageSquareIcon, Play as PlayIcon, Square as SquareIcon, RefreshCw as RefreshCwIcon, Save as SaveIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateReceiptHTML } from './PagosModule';
import { getOpenWASessions, createOpenWASession, startOpenWASession, stopOpenWASession, getOpenWAQRCode } from '../lib/whatsapp';
import { getRecentMedia, getMediaInsights } from '../utils/instagramAnalytics';
import { Heart, MessageCircle, Share2, Camera, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { LearningDispatcher } from '../learning/services/LearningDispatcher';

// ==========================================
// MÓDULO DE PAGOS DEL CLIENTE
// ==========================================
export const ClientPagosModule = ({ campaigns, onPagar }: { campaigns: Campaign[], onPagar?: (c: Campaign) => void }) => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isFlipped, setIsFlipped] = useState(false);
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
      });
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

  const filtered = pagos.filter(p => p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || p.ncf.toLowerCase().includes(searchTerm.toLowerCase()));
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
        <div className="bg-gradient-to-br from-[#1e1b4b] to-[#311042] border border-slate-800 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[200px]">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pasarela Oficial</p>
              <h3 className="text-lg font-black tracking-wide mt-0.5">PayPal Integrado</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <CreditCard className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="my-4">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Método de depósito express</p>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">Tus fondos se acreditan de forma inmediata para activar campañas en menos de 10 minutos.</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 tracking-widest">SECURE CHECKOUT</span>
            <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-lg border border-violet-500/20">Meta Verified</span>
          </div>
        </div>
      </div>

      <div id="tour-pagos-history" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por concepto o NCF..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-700" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4">NCF (e-CF)</th>
                <th className="p-4">Canal</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Cargando transacciones...</td>
                </tr>
              ) : paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No hay pagos registrados.</td>
                </tr>
              ) : (
                paginatedPagos.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(p.fecha).toLocaleDateString()}</td>
                    <td className="p-4">{p.concepto}</td>
                    <td className="p-4 text-right font-bold text-slate-900">${(p.monto * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-semibold">USD</span></td>
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
                            <button id="tour-pagos-download" onClick={() => handleDownloadPDF(p)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar Factura Electrónica (PDF)"><Download className="w-4 h-4" /></button>
                            {p.url_dgii && (
                              <a href={p.url_dgii} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors" title="Ver en DGII (Comprobante Fiscal)"><ExternalLink className="w-4 h-4" /></a>
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
    </div>
  );
};

// ==========================================
// MÓDULO DE ESTADÍSTICAS DEL CLIENTE
// ==========================================
export const ClientEstadisticasModule = ({ campaigns }: { campaigns: Campaign[] }) => {
  const [instagramPosts, setInstagramPosts] = useState<any[]>([]);
  const [loadingInsta, setLoadingInsta] = useState(false);
  const { profile } = useUser();

  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
  const avgCtr = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaigns.length : 0;
  const totalReach = campaigns.reduce((sum, c) => sum + Number((c.reach || '0').replace(/[^0-9]/g, '')), 0);

  useEffect(() => {
    const fetchInstagram = async () => {
      if (!profile?.id_usuario) return;
      setLoadingInsta(true);
      try {
        const { data: clientData } = await supabase
          .from('clientes_portal')
          .select('instagram_access_token')
          .eq('auth_user_id', profile.id_usuario)
          .maybeSingle();

        const token = clientData?.instagram_access_token;
        if (token) {
          const media = await getRecentMedia(token);
          const detailedMedia = await Promise.all(media.map(async (m: any) => {
            try {
              const insights = await getMediaInsights(m.id, token);
              return { ...m, ...insights };
            } catch {
              return m;
            }
          }));
          setInstagramPosts(detailedMedia);
        }
      } catch (err) {
        console.error("Error fetching Instagram feed:", err);
      } finally {
        setLoadingInsta(false);
      }
    };
    fetchInstagram();
  }, [profile?.id_usuario]);

  const mockChartData = [
    { name: 'Lun', alcance: 1200 },
    { name: 'Mar', alcance: 1900 },
    { name: 'Mié', alcance: 3000 },
    { name: 'Jue', alcance: 5000 },
    { name: 'Vie', alcance: 4800 },
    { name: 'Sáb', alcance: 6000 },
    { name: 'Dom', alcance: 7500 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Métricas e Informes</h2>
        <p className="text-slate-500">Supervisa el rendimiento integral de tus anuncios y publicaciones sociales.</p>
      </div>

      <div id="tour-stats-kpi" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0"><MousePointerClick className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CTR Promedio</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{avgCtr.toFixed(2)}%</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Totales</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{totalLeads.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><BarChart3 className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alcance Histórico</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{totalReach.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><CreditCard className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campañas Activas</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{campaigns.filter(c => c.status === 'Activa').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Alcance esta semana</h3>
              <p className="text-xs text-slate-500 font-medium">Personas alcanzadas por día</p>
            </div>
            <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">↑ +34% esta semana</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ResponsiveContainer width="100%" height="100%">
                <ResponsiveContainer width="100%" height="100%">
                  <div className="h-64 w-full text-slate-400 flex items-center justify-center">Gráfico semanal activo</div>
                </ResponsiveContainer>
              </ResponsiveContainer>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e1b4b] border border-slate-800 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Meta Insights API</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Conecta tu cuenta publicitaria de Meta Ads para importar conversiones, costo por lead (CPL) y ROI de forma automática.</p>
          </div>
          <div className="my-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 font-black">f</div>
            <div>
              <h4 className="text-xs font-bold">Meta Ads Business</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Integración autorizada</p>
            </div>
          </div>
          <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">Configurar Meta Ads</button>
        </div>
      </div>

      <div id="tour-stats-ig" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Camera className="text-rose-500 w-6 h-6" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Instagram Social Feed</h3>
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


