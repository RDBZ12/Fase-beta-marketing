import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Users, Megaphone, DollarSign, Activity, 
  CreditCard, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';
import type { Pago, Campaign } from '../../types';

export const AdminDashboardModule: React.FC = () => {
  const [stats, setStats] = useState({
    ingresos: 0,
    usuariosActivos: 0,
    campanasActivas: 0,
    pendientesModeracion: 0
  });
  const [recentPayments, setRecentPayments] = useState<Pago[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // 1. Ingresos Totales (Pagos completados/aceptados)
        const { data: pagosData } = await supabase
          .from('pagos')
          .select(`
            *,
            campaigns(nombre_campana, id_usuario, id_cliente)
          `)
          .eq('estado_dgii', 'Aceptado')
          .order('fecha', { ascending: false });
        
        let totalIngresosDOP = 0;
        let pagosMapeados: any[] = [];

        if (pagosData) {
          totalIngresosDOP = pagosData.reduce((sum, p) => sum + (p.total_con_itbis ?? (p.monto * 1.18)), 0);
          
          // Obtener nombres de creadores para los últimos 5
          const ultimos5 = pagosData.slice(0, 5);
          const creatorIds = [...new Set(ultimos5.map(p => p.campaigns?.id_usuario || p.campaigns?.id_cliente).filter(Boolean))];
          let usersMap: Record<string, string> = {};

          if (creatorIds.length > 0) {
            const [{ data: team }, { data: clients }] = await Promise.all([
              supabase.from('usuarios').select('id_usuario, nombre, apellido').in('id_usuario', creatorIds),
              supabase.from('clientes_portal').select('auth_user_id, nombre, apellido').in('auth_user_id', creatorIds)
            ]);

            if (team) team.forEach((u: any) => usersMap[u.id_usuario] = `${u.nombre || ''} ${u.apellido || ''}`.trim());
            if (clients) clients.forEach((c: any) => usersMap[c.auth_user_id] = `${c.nombre || ''} ${c.apellido || ''}`.trim());
          }

          pagosMapeados = ultimos5.map(p => {
            const creatorId = p.campaigns?.id_usuario || p.campaigns?.id_cliente;
            return {
              ...p,
              nombre_campana_real: p.campaigns?.nombre_campana || p.nombre_campana || 'S/N',
              creador_nombre: creatorId && usersMap[creatorId] ? usersMap[creatorId] : (p.razon_social && p.razon_social !== 'Consumidor Final' ? p.razon_social : 'Desconocido')
            };
          });
        }
        
        const totalIngresosUSD = totalIngresosDOP / 59.00; // Tasa de cambio estática

        // 2. Usuarios Activos (Usuarios del sistema)
        const { count: usuariosCount } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'activo');

        // 3. Campañas Activas
        const { count: campanasActivasCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'Activa');

        // 4. Campañas pendientes de moderación
        const { data: moderacionData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('estado_moderacion', 'pendiente')
          .limit(5);

        setStats({
          ingresos: totalIngresosUSD,
          usuariosActivos: usuariosCount || 0,
          campanasActivas: campanasActivasCount || 0,
          pendientesModeracion: moderacionData?.length || 0
        });

        setRecentPayments(pagosMapeados);
        if (moderacionData) setPendingCampaigns(moderacionData);

      } catch (error) {
        console.error("Error cargando dashboard admin", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bg} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-125`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control General</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Visión global de ingresos, moderación y estado del sistema.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={`$${stats.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
          icon={DollarSign} 
          color="text-emerald-600" 
          bg="bg-emerald-100" 
        />
        <StatCard 
          title="Campañas Activas" 
          value={stats.campanasActivas} 
          icon={Megaphone} 
          color="text-blue-600" 
          bg="bg-blue-100" 
        />
        <StatCard 
          title="Cola de Moderación" 
          value={stats.pendientesModeracion} 
          icon={Activity} 
          color="text-amber-600" 
          bg="bg-amber-100" 
        />
        <StatCard 
          title="Usuarios Activos" 
          value={stats.usuariosActivos} 
          icon={Users} 
          color="text-violet-600" 
          bg="bg-violet-100" 
        />
      </div>

      {/* Secciones de Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Campañas Pendientes de Aprobación */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Moderación Pendiente
            </h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Acción Requerida</span>
          </div>
          <div className="p-6 flex-1">
            {pendingCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <p className="text-sm font-bold text-slate-600">¡Todo al día!</p>
                <p className="text-xs text-slate-400">No hay campañas esperando moderación.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCampaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Por: {c.creatorName || 'Usuario Desconocido'}</p>
                    </div>
                    <button className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200">
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimos Ingresos */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> Últimos Pagos
            </h3>
          </div>
          <div className="p-0">
            {recentPayments.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No hay pagos registrados aún.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="px-6 py-4">Campaña / Cliente</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentPayments.map(pago => (
                    <tr key={pago.id_pago} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{(pago as any).nombre_campana_real}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Por: {(pago as any).creador_nombre} • {pago.metodo_pago}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(pago.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          USD ${( (pago.total_con_itbis ?? (pago.monto * 1.18)) / 59.00 ).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
