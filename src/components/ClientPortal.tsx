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
  FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';
import { CampaignWizard } from './CampaignWizard';
import { MisPublicacionesModule } from './MisPublicacionesModule';
import { ClientPagosModule, ClientEstadisticasModule, ClientPerfilModule } from './ClientModules';
import { CentroReportesCliente } from './reportes/CentroReportesCliente';
import { ChatbotWidget } from './ChatbotWidget';

interface ClientPortalProps {
  campaigns: Campaign[];
  onPagarCampaign: (campaign: Campaign) => void;
  refreshCampaigns: () => void;
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ClientPortal: React.FC<ClientPortalProps> = ({ campaigns, onPagarCampaign, refreshCampaigns }) => {
  const [activeTab, setActiveTab] = useState('mis-campanas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { id: 'mis-campanas', label: 'Mis Campañas', icon: Megaphone },
    { id: 'mis-publicaciones', label: 'Mis Publicaciones', icon: LayoutDashboard },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'reportes', label: 'Reportes', icon: FileText },
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
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-7 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors z-30 shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Marketdev
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
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
                {isSidebarOpen && (
                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                )}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                )}
                {!isSidebarOpen && isActive && (
                  <div className="absolute left-1 w-1 h-8 rounded-full bg-violet-500" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <header className="h-20 border-b border-slate-200 bg-white backdrop-blur-md flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold capitalize tracking-tight">
            {activeTab.replace('-', ' ')}
          </h1>
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
          {activeTab === 'mis-campanas' && <MisCampanasModule campaigns={campaigns} onNew={() => setActiveTab('nueva-campana')} onPagar={onPagarCampaign} refreshCampaigns={refreshCampaigns} />}
          {activeTab === 'nueva-campana' && <CampaignWizard onCancel={() => setActiveTab('mis-campanas')} onFinish={() => { refreshCampaigns(); setActiveTab('mis-campanas'); }} />}
          
          {activeTab === 'mis-publicaciones' && <MisPublicacionesModule campaigns={campaigns} />}
          {activeTab === 'estadisticas' && <ClientEstadisticasModule campaigns={campaigns} />}
          {activeTab === 'reportes' && <CentroReportesCliente />}
          {activeTab === 'pagos' && <ClientPagosModule campaigns={campaigns} />}
          {activeTab === 'perfil' && <ClientPerfilModule />}
        </div>
      </main>

      <ChatbotWidget />
    </div>
  );
};

// --- Subcomponentes de Vista ---

const MisCampanasModule = ({ campaigns, onNew, onPagar, refreshCampaigns }: { campaigns: Campaign[], onNew: () => void, onPagar: (c: Campaign) => void, refreshCampaigns: () => void }) => {
  const activeCamp = campaigns.filter(c => c.status === 'Activa').length;
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);
  const totalReach = campaigns.reduce((acc, c) => acc + (parseInt(String(c.reach).replace(/\D/g, '')) || 0), 0);
  const totalPresupuesto = campaigns.filter(c => c.status !== 'Borrador' && c.status !== 'Pendiente de Pago').reduce((acc, c) => acc + (c.presupuesto || 0), 0);

  const chartData = [
    { name: 'Lun', alcance: 1200 },
    { name: 'Mar', alcance: 1900 },
    { name: 'Mie', alcance: 1500 },
    { name: 'Jue', alcance: 2400 },
    { name: 'Vie', alcance: 2100 },
    { name: 'Sab', alcance: 3200 },
    { name: 'Dom', alcance: 3800 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Mis Campañas</h2>
          <p className="text-slate-500">Crea, edita y revisa el estado de tus campañas publicitarias.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onNew}
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuesto Usado</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalPresupuesto}</p>
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





const MisCampanasView = ({ campaigns, onPagar, refreshCampaigns }: { campaigns: Campaign[], onPagar: (c: Campaign) => void, refreshCampaigns: () => void }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{presupuesto: number, startDate: string, endDate: string}>({presupuesto: 0, startDate: '', endDate: ''});
  const [searchTerm, setSearchTerm] = useState('');

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

  if (selectedCampaign) {
    return (
      <div className="animate-in fade-in slide-in-from-right-8 duration-500">
        <button 
          onClick={() => setSelectedCampaign(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <span className="text-xl">←</span> Volver a mis campañas
        </button>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-8 backdrop-blur-xl mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedCampaign.name}</h2>
            <div className="flex gap-3 text-sm">
              <span className="bg-violet-600/20 text-violet-400 px-3 py-1 rounded-full font-medium border border-violet-500/20">{selectedCampaign.channel}</span>
              <span className="bg-[#2a2a4a] text-slate-700 px-3 py-1 rounded-full font-medium">{selectedCampaign.status}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm mb-1">Presupuesto</p>
            <p className="text-2xl font-bold text-emerald-400">${selectedCampaign.presupuesto || 'N/A'}</p>
            {selectedCampaign.status === 'Borrador' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onPagar(selectedCampaign); }}
                className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors"
              >
                Pagar Campaña
              </button>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-violet-400" />
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
              <div key={pub.id_publicacion} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all">
                <div className="aspect-square bg-slate-50 relative flex items-center justify-center">
                  {pub.imagen_url || selectedCampaign.image_url ? (
                     <img src={pub.imagen_url || selectedCampaign.image_url} alt="Post" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                     <ImageIcon className="w-12 h-12 text-[#2a2a4a]" />
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] font-bold text-slate-900">
                      {new Date(pub.fecha_publicacion).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{pub.titulo}</h4>
                  <p className="text-xs text-slate-700 line-clamp-3 mb-3 whitespace-pre-wrap">
                    {pub.contenido}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">{pub.nombre_red || 'Instagram'}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      pub.estado === 'Publicada' ? 'text-emerald-400 bg-emerald-400/10' :
                      pub.estado === 'Fallida' ? 'text-pink-400 bg-pink-400/10' :
                      'text-amber-400 bg-amber-400/10'
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
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {campaigns.length > 0 && (
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Tus campañas</h3>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o red..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                  <th className="px-6 py-4">Presupuesto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha Inicio</th>
                  <th className="px-6 py-4">Fecha Fin</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.brand || c.channel).toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron campañas para "{searchTerm}"
                    </td>
                  </tr>
                ) : campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.brand || c.channel).toLowerCase().includes(searchTerm.toLowerCase())).map((camp) => {
                  const isEditing = editingId === camp.id;
                  return (
                  <tr 
                    key={camp.id} 
                    onClick={() => { if (!isEditing) setSelectedCampaign(camp); }}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{camp.name}</div>
                      <div className="text-xs text-slate-500">{camp.brand || camp.channel}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">$</span>
                          <input 
                            type="number" 
                            min="0"
                            value={editForm.presupuesto}
                            onChange={(e) => setEditForm({...editForm, presupuesto: Number(e.target.value)})}
                            className="w-20 bg-transparent border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      ) : (
                        `$${camp.presupuesto || 0}`
                      )}
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
                      {isEditing ? (
                        <input 
                          type="date" 
                          min={getLocalDateString()}
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                          className="bg-transparent border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-violet-500"
                        />
                      ) : (
                        camp.startDate || 'No definida'
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <input 
                          type="date" 
                          min={editForm.startDate || getLocalDateString()}
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                          className="bg-transparent border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-violet-500"
                        />
                      ) : (
                        camp.endDate || 'No definida'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={async () => {
                                await supabase.from('campaigns').update({
                                  presupuesto: editForm.presupuesto,
                                  fecha_inicio: editForm.startDate,
                                  fecha_fin: editForm.endDate
                                }).eq('id', camp.id);
                                setEditingId(null);
                                refreshCampaigns();
                              }}
                              className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-xs"
                            >
                              Guardar
                            </button>
                          </>
                        ) : (
                          <>
                            {camp.status === 'Borrador' && (
                              <button 
                                onClick={() => {
                                  setEditForm({
                                    presupuesto: camp.presupuesto || 0,
                                    startDate: camp.startDate || '',
                                    endDate: camp.endDate || ''
                                  });
                                  setEditingId(camp.id);
                                }}
                                className="px-3 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg text-xs transition-colors"
                              >
                                Editar
                              </button>
                            )}
                            {camp.status === 'Borrador' ? (
                              <button 
                                onClick={() => onPagar(camp)}
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-sm"
                              >
                                Pagar
                              </button>
                            ) : (
                              <button 
                                onClick={() => setSelectedCampaign(camp)}
                                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-lg text-xs transition-colors"
                              >
                                Detalles
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


