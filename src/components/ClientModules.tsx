import { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, BarChart3, Users, MousePointerClick, User, Shield, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateReceiptHTML } from './PagosModule';

// ==========================================
// MÓDULO DE PAGOS DEL CLIENTE
// ==========================================
export const ClientPagosModule = ({ campaigns }: { campaigns: Campaign[] }) => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      const formatPagos = paidCampaigns.map(c => ({
        id: c.id,
        fecha: c.startDate || new Date().toISOString(),
        concepto: `Campaña: ${c.name}`,
        nombre_campana: c.name,
        monto: c.presupuesto || 0,
        estado: 'Aprobado',
        ncf: getStableNCF(c.id),
        metodo_pago: 'PayPal',
        rnc_cedula: clientRnc || undefined,
        razon_social: clientEmpresa || undefined,
        id_campana: c.id
      }));
      
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Historial de Pagos</h2>
          <p className="text-slate-500">Revisa tus transacciones y descarga tus comprobantes fiscales (e-CF).</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden backdrop-blur-xl">
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
                pagos.map((pago) => (
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
              )}
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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!profile?.id_usuario) return;

      // 1. Cargar desde localStorage primero para velocidad e inmediatez
      const cachedEmpresa = localStorage.getItem(`client_empresa_${profile.id_usuario}`) || '';
      const cachedRnc = localStorage.getItem(`client_rnc_${profile.id_usuario}`) || '';
      setEmpresa(cachedEmpresa);
      setRnc(cachedRnc);

      // 2. Cargar desde Supabase clientes_portal
      try {
        const { data, error } = await supabase
          .from('clientes_portal')
          .select('rnc, empresa')
          .eq('auth_user_id', profile.id_usuario)
          .maybeSingle();

        if (data && !error) {
          setEmpresa(data.empresa || cachedEmpresa);
          setRnc(data.rnc || cachedRnc);
          if (data.empresa) localStorage.setItem(`client_empresa_${profile.id_usuario}`, data.empresa);
          if (data.rnc) localStorage.setItem(`client_rnc_${profile.id_usuario}`, data.rnc);
        }
      } catch (err) {
        console.warn("Table clientes_portal not found, using localStorage fallback.");
      }
    };
    loadProfile();
  }, [profile?.id_usuario]);

  const handleSave = async () => {
    if (!profile?.id_usuario) return;
    setSaving(true);
    setMsg('');
    setError('');

    // 1. Guardar siempre en localStorage (inmediato y garantizado)
    localStorage.setItem(`client_empresa_${profile.id_usuario}`, empresa);
    localStorage.setItem(`client_rnc_${profile.id_usuario}`, rnc);

    // 2. Intentar guardar en Supabase clientes_portal
    try {
      const { data: existing } = await supabase
        .from('clientes_portal')
        .select('id_cliente')
        .eq('auth_user_id', profile.id_usuario)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabase
          .from('clientes_portal')
          .update({ empresa, rnc, updated_at: new Date().toISOString() })
          .eq('auth_user_id', profile.id_usuario);
      } else {
        result = await supabase
          .from('clientes_portal')
          .insert({
            auth_user_id: profile.id_usuario,
            nombre: profile.nombre || 'Cliente',
            apellido: profile.apellido || '',
            email: profile.correo || '',
            empresa,
            rnc,
          });
      }

      if (result.error) {
        console.warn("DB Save failed, using localStorage fallback only:", result.error.message);
        setMsg('Guardado localmente en el navegador (ejecute las migraciones en Supabase para sincronizar con la base de datos).');
      } else {
        setMsg('¡Perfil actualizado con éxito en la base de datos!');
      }
    } catch (err: any) {
      console.error(err);
      setMsg('Guardado localmente en el navegador.');
    } finally {
      setSaving(false);
      window.dispatchEvent(new Event('client-profile-updated'));
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
                onChange={e => setRnc(e.target.value)}
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
