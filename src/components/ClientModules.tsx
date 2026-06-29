import { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, BarChart3, Users, MousePointerClick, User, Shield, CheckCircle2, Save, Loader2, Search, Play, Square, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateReceiptHTML } from './PagosModule';
import { getOpenWASessions, createOpenWASession, startOpenWASession, stopOpenWASession, getOpenWAQRCode } from '../lib/whatsapp';

// ==========================================
// MÓDULO DE PAGOS DEL CLIENTE
// ==========================================
export const ClientPagosModule = ({ campaigns }: { campaigns: Campaign[] }) => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useUser();

  // Genera un NCF estable para la campaña basándose en su ID
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
        // Fallback inmediato desde localStorage
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

      // Las campañas pagadas son aquellas que no están en 'Pendiente de Pago' ni en 'Borrador'
      const paidCampaigns = campaigns.filter(c => c.status !== 'Pendiente de Pago' && c.status !== 'Borrador');
      
      let dbPagos: any[] = [];
      if (paidCampaigns.length > 0) {
        const { data, error } = await supabase
          .from('pagos')
          .select('*')
          .in('id_campana', paidCampaigns.map(c => c.id));
        if (!error && data) {
          dbPagos = data;
        }
      }

      const formatPagos = paidCampaigns.map(c => {
        const dbPago = dbPagos.find(p => p.id_campana === c.id);
        
        return {
          id: dbPago ? dbPago.id_pago : c.id,
          fecha: dbPago ? dbPago.created_at : (c.startDate || new Date().toISOString()),
          concepto: `Campaña: ${c.name}`,
          nombre_campana: c.name,
          monto: c.presupuesto || 0, // Usamos el presupuesto original de la campaña en USD en lugar del dbPago.monto que está en DOP sin ITBIS
          estado: 'Aprobado',
          ncf: dbPago?.ncf || getStableNCF(c.id),
          metodo_pago: dbPago?.metodo_pago || 'PayPal',
          rnc_cedula: dbPago?.rnc_cedula || clientRnc || undefined,
          razon_social: dbPago?.razon_social || clientEmpresa || undefined,
          id_campana: c.id
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

  const totalInvertido = pagos.reduce((sum, p) => sum + p.monto, 0);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const chartData = monthNames.map((name, index) => {
    const pagosMes = pagos.filter(p => {
      const d = new Date(p.fecha);
      return d.getMonth() === index && d.getFullYear() === currentYear;
    });
    const monto = pagosMes.reduce((sum, p) => sum + p.monto, 0);
    return { name, monto };
  }).filter((_, index) => index <= currentDate.getMonth()); // Muestra desde Enero hasta el mes actual

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Panel de Pagos</h2>
          <p className="text-slate-500">Administra tus métodos de pago, inversiones y comprobantes (e-CF).</p>
        </div>
      </div>

      {/* Dashboard Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Invertido */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Inversión Total</h3>
            <p className="text-xs text-slate-500 mb-4">Balance de campañas pagadas</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-slate-900 tracking-tight">${totalInvertido.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-l-violet-600 border-t-violet-600 transform -rotate-45" />
            <div className="text-xs text-slate-500">
              <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-full bg-violet-600" /> PayPal</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200" /> Tarjeta</div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Balance over time */}
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

        {/* Credit Card UI */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 rounded-3xl p-7 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <span className="font-semibold tracking-widest text-xs opacity-80 uppercase">Método Principal</span>
              <p className="font-bold text-lg mt-0.5">PayPal Business</p>
            </div>
            <div className="flex gap-1 opacity-90">
              <div className="w-7 h-7 bg-white/80 rounded-full mix-blend-screen" />
              <div className="w-7 h-7 bg-white/50 rounded-full mix-blend-screen -ml-4" />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="font-mono text-xl tracking-[0.15em] mb-4 text-white/90">**** **** **** 5049</p>
            <div className="flex justify-between items-end text-xs">
              <div>
                <p className="text-white/60 mb-1 uppercase tracking-wider text-[10px]">Titular</p>
                <p className="font-semibold tracking-wider truncate max-w-[120px]">{profile?.nombre?.toUpperCase() || 'CLIENTE'}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 mb-1 uppercase tracking-wider text-[10px]">Expira</p>
                <p className="font-semibold tracking-wider">08/28</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Depósitos recientes</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar pago o NCF..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="p-4">Fecha</th>
                <th className="p-4">Concepto</th>
                <th className="p-4">Monto (USD)</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Comprobante Fiscal (NCF)</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a] text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">Cargando pagos...</td></tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-12 h-12 text-[#2a2a4a] mx-auto mb-3" />
                    No tienes pagos registrados.
                  </td>
                </tr>
              ) : (
                pagos.filter(p => p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || p.ncf.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron resultados para "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  pagos.filter(p => p.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || p.ncf.toLowerCase().includes(searchTerm.toLowerCase())).map((pago) => (
                  <tr key={pago.id} className="hover:bg-[#2a2a4a]/20 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(pago.fecha).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-800">{pago.concepto}</td>
                    <td className="p-4 font-bold text-slate-900">${pago.monto.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        {pago.estado}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{pago.ncf}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDownloadPDF(pago)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-400 hover:text-slate-900 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MÓDULO DE ESTADÍSTICAS DEL CLIENTE
// ==========================================
export const ClientEstadisticasModule = ({ campaigns }: { campaigns: any[] }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [realClicks, setRealClicks] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const activeCamp = campaigns.filter(c => c.status === 'Activa').length;
  const totalReach = campaigns.reduce((acc, c) => acc + (parseInt(String(c.reach).replace(/\D/g, '')) || 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);

  useEffect(() => {
    const fetchRealData = async () => {
      const campIds = campaigns.map(c => c.id);
      if (campIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: pubs } = await supabase
        .from('publicaciones')
        .select('id_publicacion, fecha_publicacion')
        .in('id_campana', campIds);

      if (pubs) {
        // Agrupar publicaciones por fecha (últimos 7 días)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return { date: d.toISOString().split('T')[0], count: 0 };
        });

        pubs.forEach(pub => {
          if (pub.fecha_publicacion) {
            const pubDate = pub.fecha_publicacion.split('T')[0];
            const dayEntry = last7Days.find(d => d.date === pubDate);
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
              const dateStr = int.fecha.split('T')[0];
              interactionsByDate[dateStr] = (interactionsByDate[dateStr] || 0) + int.cantidad;
            });
          }
        }

        // Formatear fechas para el gráfico
        const formattedData = last7Days.map(d => ({
          fecha: d.date.split('-').slice(1).join('/'),
          publicaciones: d.count,
          interacciones: interactionsByDate[d.date] || 0 // Usar métricas reales de HikerAPI
        }));
        
        
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

      setLoading(false);
    };

    fetchRealData();
  }, [campaigns]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Estadísticas y Resultados</h2>
        <p className="text-slate-500">Métricas en tiempo real basadas en la actividad de tu cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <h3 className="text-lg font-bold text-slate-700 mb-6">Actividad de Publicaciones (Últimos 7 días)</h3>
        {loading ? (
           <div className="flex justify-center items-center h-[300px]">Cargando métricas...</div>
        ) : chartData.length > 0 && chartData.some(d => d.publicaciones > 0) ? (
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
             <p className="text-slate-500">Aún no hay publicaciones en los últimos 7 días.</p>
           </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MÓDULO DE PERFIL DEL CLIENTE
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
    } catch (err: any) {
      console.error(err);
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
          
          if (data.empresa) localStorage.setItem(`client_empresa_${profile.id_usuario}`, data.empresa);
          if (data.rnc) localStorage.setItem(`client_rnc_${profile.id_usuario}`, data.rnc);
          if (data.whatsapp_session_name) localStorage.setItem(`client_whatsapp_session_${profile.id_usuario}`, data.whatsapp_session_name);
          if (data.whatsapp_phone) localStorage.setItem(`client_whatsapp_phone_${profile.id_usuario}`, data.whatsapp_phone);
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
      const payload: any = { 
        empresa, 
        rnc,
        whatsapp_session_name: whatsappSessionName,
        whatsapp_phone: whatsappPhone,
        updated_at: new Date().toISOString() 
      };
      
      const { data: existing } = await supabase
        .from('clientes_portal')
        .select('id_cliente')
        .eq('auth_user_id', profile.id_usuario)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabase
          .from('clientes_portal')
          .update(payload)
          .eq('auth_user_id', profile.id_usuario);
      } else {
        result = await supabase
          .from('clientes_portal')
          .insert({
            auth_user_id: profile.id_usuario,
            nombre: profile.nombre || 'Cliente',
            apellido: profile.apellido || '',
            email: profile.correo || '',
            ...payload
          });
      }

      if (result.error) {
        console.warn("DB Save failed, using localStorage fallback only:", result.error.message);
        setMsg('¡Configuración guardada localmente con éxito!');
      } else {
        setMsg('¡Perfil y datos de facturación guardados con éxito!');
      }
    } catch (err: any) {
      console.error(err);
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
      if (session.status !== 'ready' && session.status !== 'qr_ready') {
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-4xl font-bold text-slate-900 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
          {profile?.nombre?.charAt(0) || 'U'}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{profile?.nombre} {profile?.apellido}</h2>
        <p className="text-slate-500">Cuenta de Cliente vinculada con Google</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px]" />

        {msg && (
          <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {msg}
          </div>
        )}
        {error && (
          <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            Datos de Facturación Fiscal (e-CF)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Razón Social / Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                placeholder="Ej. Tabacalera del Caribe S.A.S."
                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                RNC o Cédula de Identidad *
              </label>
              <input
                type="text"
                value={rnc}
                onChange={e => setRnc(e.target.value.replace(/[^0-9-]/g, ''))}
                placeholder="Ej. 1-31-00000-0 o 001-0000000-0"
                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar Datos de Facturación'}</span>
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Configuración de WhatsApp Web (OpenWA)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Vincule su propio número de WhatsApp para que los mensajes de marketing y alertas se envíen desde su cuenta personal de forma nativa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Número de Teléfono Vinculado (con Código de País)
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="Ej. 18095551234"
                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nombre de Sesión asignado
              </label>
              <input
                type="text"
                disabled
                value={whatsappSessionName}
                className="w-full px-4 py-2.5 text-xs font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Conexión</p>
              <div className="flex items-center gap-2 mt-1">
                {currentSession ? (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    currentSession.status === 'ready' ? 'text-emerald-500 bg-emerald-100' :
                    currentSession.status === 'qr_ready' ? 'text-amber-500 bg-amber-100' :
                    'text-slate-500 bg-slate-100'
                  }`}>
                    {currentSession.status === 'ready' ? 'Conectado' :
                     currentSession.status === 'qr_ready' ? 'Esperando QR' :
                     currentSession.status}
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">No Creada</span>
                )}
              </div>
              {currentSession?.phone && (
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Dispositivo activo: <strong className="text-slate-700">+{currentSession.phone}</strong>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(!currentSession || currentSession.status === 'disconnected' || currentSession.status === 'created' || currentSession.status === 'failed') ? (
                <button
                  onClick={handleCreateAndStart}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {currentSession ? 'Iniciar Conexión' : 'Vincular Dispositivo'}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                  Desconectar WhatsApp
                </button>
              )}

              {whatsappSessionName && (
                <button
                  onClick={fetchSessionStatus}
                  disabled={actionLoading}
                  className="flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                  title="Actualizar estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {currentSession?.status === 'qr_ready' && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-5 text-xs space-y-4 mt-4 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-sm"><AlertCircle className="w-4 h-4 text-amber-500" /> Vinculación de WhatsApp requerida</p>
                <p>Por favor, escanea el código QR de la derecha utilizando tu teléfono móvil para activar la conexión de envíos:</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-600 font-semibold">
                  <li>Abre WhatsApp en tu teléfono.</li>
                  <li>Ve a **Dispositivos Vinculados** → **Vincular un dispositivo**.</li>
                  <li>Apunta tu cámara hacia el código QR de la derecha.</li>
                </ol>
                <p className="text-[10px] text-amber-600 font-bold">El estado se actualizará automáticamente a "Conectado" en esta pantalla una vez completado.</p>
              </div>
              <div className="w-44 h-44 bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-slate-400 gap-1.5 p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    <span className="text-[10px]">Cargando QR...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar Configuración de WhatsApp'}</span>
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />


        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            Datos Personales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</span>
              <span className="text-slate-800 font-medium">{profile?.nombre} {profile?.apellido}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Identificador de Usuario</span>
              <span className="text-slate-500 font-mono text-sm truncate block">{profile?.id_usuario}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Seguridad y Accesos
          </h3>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2.5">
                <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Google OAuth</h4>
                <p className="text-sm text-slate-500">Cuenta verificada y vinculada</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Conectado
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
