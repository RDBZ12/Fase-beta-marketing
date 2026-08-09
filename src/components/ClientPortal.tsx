import {
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  BarChart3,
  Rocket,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Search,
  FileText,
  Menu,
  BookOpen,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, X } from 'lucide-react';
import type { Campaign } from '../types';
import { CampaignWizard } from './CampaignWizard';
import { MisPublicacionesModule } from './MisPublicacionesModule';
import { ClientPagosModule, ClientEstadisticasModule, ClientPerfilModule } from './ClientModules';
import { CentroReportesCliente } from './reportes/CentroReportesCliente';
import LearningCenter from '../learning/components/LearningCenter';
import { LearningDispatcher } from '../learning/services/LearningDispatcher';
import ClientAuditLogs from './ClientAuditLogs';

interface ClientPortalProps {
  campaigns: Campaign[];
  onPagarCampaign: (campaign: Campaign) => void;
  refreshCampaigns: () => void;
}



export const ClientPortal: React.FC<ClientPortalProps> = ({ campaigns, onPagarCampaign, refreshCampaigns }) => {
  const [activeTab, setActiveTab] = useState('Panel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [showCenter, setShowCenter] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { id: 'Panel', label: 'Panel', icon: Megaphone },
    { id: 'mis-publicaciones', label: 'Mis Publicaciones', icon: LayoutDashboard },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'reportes', label: 'Reportes', icon: FileText },
    { id: 'auditoria', label: 'Historial / Auditoría', icon: Clock },
    { id: 'ayuda', label: 'Centro de Ayuda', icon: BookOpen },
    { id: 'perfil', label: 'Mi Perfil', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500/30">
      {/* Sidebar - Dark theme glassmorphism */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900 flex flex-col relative z-20`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800 overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight text-white transition-all duration-300 ${
              isSidebarOpen ? 'opacity-100 max-w-[150px] ml-3' : 'opacity-0 max-w-0 ml-0'
            }`}>
              Marketdev
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id === 'ayuda' ? setShowCenter(true) : setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className={`text-sm font-medium tracking-wide transition-all duration-300 ${
                  isSidebarOpen ? 'opacity-100 max-w-[150px] ml-3' : 'opacity-0 max-w-0 ml-0'
                }`}>
                  {item.label}
                </span>
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                )}
                {!isSidebarOpen && isActive && (
                  <div className="absolute left-1 w-1 h-8 rounded-full bg-violet-500" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 overflow-hidden whitespace-nowrap">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`text-sm font-medium transition-all duration-300 ${
              isSidebarOpen ? 'opacity-100 max-w-[150px] ml-3' : 'opacity-0 max-w-0 ml-0'
            }`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <header className="h-20 border-b border-slate-200 bg-white backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 hover:bg-slate-200 transition-colors relative">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-xs font-bold text-violet-600">CL</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {activeTab === 'Panel' && <MisCampanasModule campaigns={campaigns} onNew={() => setIsCreatingCampaign(true)} onPagar={onPagarCampaign} refreshCampaigns={refreshCampaigns} />}
          
          
          {activeTab === 'mis-publicaciones' && <MisPublicacionesModule campaigns={campaigns} />}
          {activeTab === 'estadisticas' && <ClientEstadisticasModule campaigns={campaigns} />}
          {activeTab === 'reportes' && <CentroReportesCliente />}
          {activeTab === 'auditoria' && <ClientAuditLogs />}
          {activeTab === 'pagos' && <ClientPagosModule campaigns={campaigns} onPagar={onPagarCampaign} />}
          {activeTab === 'perfil' && <ClientPerfilModule />}
        </div>
      </main>

      {isCreatingCampaign && (
        <div className="fixed inset-0 z-[1008] flex items-center justify-center bg-black/70 p-4 pl-64 overflow-y-auto">
           <div className="w-full max-w-5xl bg-white rounded-[10px] shadow-[0_0_40px_rgba(0,0,0,0.4)] relative my-8 animate-blur-in">
             <button onClick={() => setIsCreatingCampaign(false)} className="absolute top-3 right-3 z-50 p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
               <X className="w-5 h-5" />
             </button>
             <div className="p-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 rounded-3xl">
               <CampaignWizard onCancel={() => setIsCreatingCampaign(false)} onFinish={() => { refreshCampaigns(); setIsCreatingCampaign(false); }} />
             </div>
           </div>
        </div>
      )}
      
      {showCenter && <LearningCenter onClose={() => setShowCenter(false)} />}
    </div>
  );
};

// --- Subcomponentes de Vista ---

const MisCampanasModule = ({ campaigns, onNew, onPagar, refreshCampaigns }: { campaigns: Campaign[], onNew: () => void, onPagar: (c: Campaign) => void, refreshCampaigns: () => void }) => {
  const [realLeads, setRealLeads] = useState(0);
  const [realReach, setRealReach] = useState(0);
  const [chartData, setChartData] = useState<any[]>([
    { name: 'Lun', alcance: 0 },
    { name: 'Mar', alcance: 0 },
    { name: 'Mie', alcance: 0 },
    { name: 'Jue', alcance: 0 },
    { name: 'Vie', alcance: 0 },
    { name: 'Sab', alcance: 0 },
    { name: 'Dom', alcance: 0 },
  ]);

  useEffect(() => {
    async function fetchRealMetrics() {
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        return { date: d.toISOString().split('T')[0], name: dayName.charAt(0).toUpperCase() + dayName.slice(1), alcance: 0 };
      });

      if (!campaigns || campaigns.length === 0) {
        setRealLeads(0);
        setRealReach(0);
        setChartData(last7Days.map(d => ({ name: d.name, alcance: d.alcance })));
        return;
      }
      const campIds = campaigns.map(c => c.id);

      // Real Leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('id_campana', campIds);
      
      setRealLeads(leadsCount || 0);

      // Real Reach (Alcance)
      const { data: pubs } = await supabase
        .from('publicaciones')
        .select('id_publicacion')
        .in('id_campana', campIds);
      
      if (pubs && pubs.length > 0) {
        const pubIds = pubs.map(p => p.id_publicacion);
        const { data: ints } = await supabase
          .from('interacciones')
          .select('cantidad, fecha')
          .in('id_publicacion', pubIds)
          .in('tipo_interaccion', ['alcance', 'impresion']);
        
        if (ints) {
          const totalA = ints.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
          setRealReach(totalA);

          ints.forEach(int => {
            if (int.fecha) {
              const dateStr = int.fecha.split('T')[0];
              const dayEntry = last7Days.find(d => d.date === dateStr);
              if (dayEntry) dayEntry.alcance += (int.cantidad || 0);
            }
          });
          setChartData(last7Days.map(d => ({ name: d.name, alcance: d.alcance })));
        } else {
          setChartData(last7Days.map(d => ({ name: d.name, alcance: d.alcance })));
        }
      } else {
        setRealReach(0);
        setChartData(last7Days.map(d => ({ name: d.name, alcance: d.alcance })));
      }
    }
    fetchRealMetrics();
  }, [campaigns]);

  const activeCamp = campaigns.filter(c => c.status === 'Activa').length;
  const totalLeads = realLeads;
  const totalReach = realReach;
  const totalPresupuesto = campaigns.filter(c => c.status !== 'Borrador' && c.status !== 'Pendiente de Pago').reduce((acc, c) => acc + (c.presupuesto || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Campaña</h2>
          <p className="text-slate-500">Crea, edita y revisa el estado de tus campañas publicitarias.</p>
        </div>
        <div className="flex gap-3">
          <button 
            id="tour-btn-new-campaign"
            onClick={() => {
              onNew();
              LearningDispatcher.dispatch('UPDATE_UI_STATE', { currentModal: 'campaignWizard' });
              LearningDispatcher.dispatch('TRIGGER_ACTION', 'click_new_campaign');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Campaña
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-colors group shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campañas Activas</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{activeCamp}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors group shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Generados</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 transition-colors group shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alcance Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalReach > 0 ? (totalReach / 1000).toFixed(1) + 'K' : '0'}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-colors group shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuesto Usado (Inc. ITBIS)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${(totalPresupuesto * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Alcance esta semana</h3>
            <p className="text-sm text-slate-500">Personas alcanzadas por día</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            +34% esta semana
          </div>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#7c3aed', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="alcance" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <MisCampanasView campaigns={campaigns} onPagar={onPagar} refreshCampaigns={refreshCampaigns} />
    </div>
  );
};


// --- Modal para Editar Campaña y sus Publicaciones ---
export const ClientEditCampaignModal = ({ 
  campaign, 
  onClose, 
  onSave 
}: { 
  campaign: Campaign, 
  onClose: () => void, 
  onSave: () => void 
}) => {
  const [presupuesto, setPresupuesto] = useState(campaign.presupuesto || 0);
  const [startDate, setStartDate] = useState(campaign.startDate || '');
  const [endDate, setEndDate] = useState(campaign.endDate || '');
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('publicaciones')
      .select('*')
      .eq('id_campana', campaign.id)
      .then(({ data }) => {
        if (data) setPublicaciones(data);
        setLoading(false);
      });
  }, [campaign.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Campaign
      await supabase.from('campaigns').update({
        presupuesto,
        fecha_inicio: startDate,
        start_date: startDate,
        fecha_fin: endDate
      }).eq('id', campaign.id);

      // 2. Update Publicaciones
      for (const pub of publicaciones) {
        await supabase.from('publicaciones').update({
          contenido: pub.contenido
        }).eq('id_publicacion', pub.id_publicacion);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Editar Campaña</h3>
            <p className="text-sm text-slate-500">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Presupuesto ($)</label>
              <input 
                type="number" min="0" value={presupuesto} onChange={e => setPresupuesto(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Inicio</label>
              <input 
                type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Fin</label>
              <input 
                type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-500" />
              Contenido de las Publicaciones
            </h4>
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Cargando publicaciones...</div>
            ) : publicaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-xl">No hay publicaciones en esta campaña.</div>
            ) : (
              <div className="space-y-4">
                {publicaciones.map((pub, idx) => (
                  <div key={pub.id_publicacion} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <label className="block text-xs font-bold text-slate-600 mb-2">Post #{idx + 1} - {pub.titulo}</label>
                    <textarea 
                      rows={5}
                      value={pub.contenido}
                      onChange={e => {
                        const newPubs = [...publicaciones];
                        newPubs[idx].contenido = e.target.value;
                        setPublicaciones(newPubs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-2">Asegúrate de no exceder el límite de hashtags si hubo un error de validación.</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};


const MisCampanasView = ({ campaigns, onPagar, refreshCampaigns }: { campaigns: Campaign[], onPagar: (c: Campaign) => void, refreshCampaigns: () => void }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [editingCampaignModal, setEditingCampaignModal] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (selectedCampaign) {
      setLoadingPubs(true);
      supabase.from('publicaciones')
        .select('*, redes_sociales(nombre_red)')
        .eq('id_campana', selectedCampaign.id)
        .order('fecha_publicacion', { ascending: true })
        .then(({ data }) => {
          if (data) {
            const mapped = data.map(p => ({
              ...p,
              nombre_red: (p as any).redes_sociales?.nombre_red || 'Instagram'
            }));
            setPublicaciones(mapped);
          }
          setLoadingPubs(false);
        });
    } else {
      setPublicaciones([]);
    }
  }, [selectedCampaign]);

  // View moved to modal overlay at the bottom

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {campaigns.length > 0 && (
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-start items-start sm:items-center gap-6 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Tus campañas</h3>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o red..." 
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}
        {campaigns.length === 0 ? (
          <div className="py-20 text-center">
            <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Aún no tienes campañas</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Crea tu primera campaña con IA ahora.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Campaña</th>
                  <th className="px-6 py-4">Presupuesto (Inc. ITBIS)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha Inicio</th>
                  <th className="px-6 py-4">Fecha Fin</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const filtered = campaigns.filter(c => 
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (c.brand || c.channel || '').toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  const paginatedCampaigns = filtered.slice(page * pageSize, (page + 1) * pageSize);
                  
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No se encontraron campañas para "{searchTerm}"
                        </td>
                      </tr>
                    );
                  }
                  
                  return paginatedCampaigns.map((camp) => {
                    return (
                      <tr 
                        key={camp.id} 
                        onClick={() => setSelectedCampaign(camp)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{camp.name}</div>
                          <div className="text-xs text-slate-500">{camp.brand || camp.channel}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium" onClick={(e) => e.stopPropagation()}>
                          ${((camp.presupuesto || 0) * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            camp.status === 'Activa' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                            camp.status === 'Borrador' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                            'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500" onClick={(e) => e.stopPropagation()}>
                          {camp.startDate || 'No definida'}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {camp.endDate || 'No definida'}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {camp.status === 'Borrador' && camp.estado_moderacion !== 'rechazada' && (
                              <button 
                                onClick={() => setEditingCampaignModal(camp)}
                                className="px-3 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg text-xs transition-colors"
                              >
                                Editar
                              </button>
                            )}
                            {camp.status === 'Borrador' ? (
                              camp.estado_moderacion === 'aprobada' ? (
                                <button 
                                  onClick={() => onPagar(camp)}
                                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-sm"
                                >
                                  Pagar
                                </button>
                              ) : camp.estado_moderacion === 'rechazada' ? (
                                <div className="group relative">
                                  <span className="px-3 py-1.5 bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 cursor-not-allowed">
                                    Cancelada
                                  </span>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Tu campaña fue cancelada/rechazada.
                                  </div>
                                </div>
                              ) : (
                                <div className="group relative">
                                  <span className="px-3 py-1.5 bg-slate-100 text-slate-500 font-bold rounded-lg text-xs border border-slate-200 cursor-not-allowed">
                                    En revisión
                                  </span>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Tu campaña está siendo revisada, te avisaremos.
                                  </div>
                                </div>
                              )
                            ) : (
                              <button 
                                onClick={() => setSelectedCampaign(camp)}
                                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-lg text-xs transition-colors"
                              >
                                Detalles
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {(() => {
          const filtered = campaigns.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (c.brand || c.channel || '').toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (filtered.length === 0) return null;
          return (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-700">{(page * pageSize) + 1}</span> a <span className="font-bold text-slate-700">{Math.min((page + 1) * pageSize, filtered.length)}</span> de <span className="font-bold text-slate-700">{filtered.length}</span> registros
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">Filas:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-sm font-medium text-slate-600 px-2">
                    Página {filtered.length === 0 ? 0 : page + 1} de {Math.ceil(filtered.length / pageSize)}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize) - 1, p + 1))}
                    disabled={page >= Math.ceil(filtered.length / pageSize) - 1 || filtered.length === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {editingCampaignModal && (
        <ClientEditCampaignModal 
          campaign={editingCampaignModal} 
          onClose={() => setEditingCampaignModal(null)} 
          onSave={refreshCampaigns} 
        />
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 z-[1008] flex items-center justify-center bg-black/70 p-4 pl-0 sm:pl-64 overflow-y-auto">
          <div className="w-full max-w-6xl bg-white rounded-[10px] shadow-[0_0_40px_rgba(0,0,0,0.4)] relative my-8 animate-bounce-down max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-3 right-3 z-50 p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedCampaign.name}</h2>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full font-medium border border-violet-200">{selectedCampaign.channel}</span>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200">{selectedCampaign.status}</span>
                  </div>
                </div>
                <div className="text-left md:text-right flex flex-col items-start md:items-end">
                  <p className="text-slate-500 text-sm mb-1">Presupuesto (Inc. ITBIS)</p>
                  <p className="text-2xl font-bold text-emerald-600">${((selectedCampaign.presupuesto || 0) * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Aprox. <strong className="text-slate-700">RD$ {(Number(selectedCampaign.presupuesto || 0) * 60).toLocaleString('en-US')}</strong> + ITBIS (18%) = <strong className="text-emerald-600">RD$ {(Number(selectedCampaign.presupuesto || 0) * 60 * 1.18).toLocaleString('en-US')}</strong>
                  </p>
                  {selectedCampaign.status === 'Borrador' && (
                    selectedCampaign.estado_moderacion === 'aprobada' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPagar(selectedCampaign); }}
                        className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors"
                      >
                        Pagar Campaña
                      </button>
                    ) : selectedCampaign.estado_moderacion === 'rechazada' ? (
                      <div className="group relative mt-2">
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 cursor-not-allowed">
                          Cancelada
                        </span>
                        <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Tu campaña fue cancelada/rechazada.
                        </div>
                      </div>
                    ) : (
                      <div className="group relative mt-2">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 font-bold rounded-lg text-xs border border-slate-200 cursor-not-allowed">
                          En revisión
                        </span>
                        <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Tu campaña está siendo revisada por nuestro sistema de IA. Te notificaremos cuando esté aprobada para proceder con el pago.
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2 text-slate-800">
                <ImageIcon className="w-5 h-5 text-violet-500" />
                Publicaciones Generadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingPubs ? (
                   <div className="col-span-full py-10 text-center text-slate-500">Cargando publicaciones...</div>
                ) : publicaciones.length === 0 ? (
                   <div className="col-span-full py-10 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                     No hay publicaciones programadas para esta campaña.
                   </div>
                ) : (
                  publicaciones.map((pub) => (
                    <div key={pub.id_publicacion} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-violet-300 transition-all shadow-sm">
                      <div className="aspect-square bg-slate-50 relative flex items-center justify-center">
                        {pub.imagen_url || selectedCampaign.image_url ? (
                           <img src={pub.imagen_url || selectedCampaign.image_url} alt="Post" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        ) : (
                           <ImageIcon className="w-12 h-12 text-slate-300" />
                        )}
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/10">
                          <Calendar className="w-3.5 h-3.5 text-violet-300" />
                          <span className="text-[11px] font-bold text-white tracking-wide">
                            {new Date(pub.fecha_publicacion).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">{pub.titulo}</h4>
                        <p className="text-xs text-slate-600 line-clamp-3 mb-3 whitespace-pre-wrap">
                          {pub.contenido}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                          <span className="text-xs font-semibold text-slate-500">{pub.nombre_red || 'Instagram'}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            pub.estado === 'Publicada' ? 'text-emerald-700 bg-emerald-100' :
                            pub.estado === 'Fallida' ? 'text-rose-700 bg-rose-100' :
                            'text-amber-700 bg-amber-100'
                          }`}>
                            <AlertCircle className="w-3 h-3" /> {pub.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


