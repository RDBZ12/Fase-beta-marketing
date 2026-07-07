import React, { useState, useEffect } from 'react';
import { 
  Users, Megaphone, FileText, Search, 
  TrendingUp, ArrowUpRight, ArrowLeft, DollarSign, Bot, BarChart3, Database
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { TableClientes } from './tables/TableClientes';
import { TableCampaigns } from './tables/TableCampaigns';
import { TableLeads } from './tables/TableLeads';
import { TablePagos } from './tables/TablePagos';
import { TableChatbot } from './tables/TableChatbot';
import { TableInteracciones } from './tables/TableInteracciones';
import { TablePublicaciones } from './tables/TablePublicaciones';
import { TableContenidoIA } from './tables/TableContenidoIA';

const queriesData = [
  { id: 'clientes', title: 'Clientes', icon: Users, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', shadow: 'hover:shadow-blue-500/40', table: 'usuarios' },
  { id: 'campanas', title: 'Campañas', icon: Megaphone, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-purple-500 to-purple-700', shadow: 'hover:shadow-purple-500/40', table: 'campaigns' },
  { id: 'leads', title: 'Leads', icon: FileText, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600', shadow: 'hover:shadow-emerald-500/40', table: 'leads' },
  { id: 'pagos', title: 'Pagos', icon: DollarSign, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', shadow: 'hover:shadow-amber-500/40', table: 'pagos' },
  { id: 'chatbot', title: 'Historial Chatbot', icon: Bot, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-pink-500 to-pink-700', shadow: 'hover:shadow-pink-500/40', table: 'chatbot_historial' },
  { id: 'interacciones', title: 'Interacciones', icon: BarChart3, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600', shadow: 'hover:shadow-orange-500/40', table: 'interacciones' },
  { id: 'publicaciones', title: 'Publicaciones', icon: TrendingUp, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-cyan-400 to-cyan-600', shadow: 'hover:shadow-cyan-500/40', table: 'publicaciones' },
  { id: 'contenido_ia', title: 'Contenido IA', icon: Bot, color: '#ffffff', bg: 'bg-white/20', gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700', shadow: 'hover:shadow-indigo-500/40', table: 'contenido_ia' },
];

export const DataExplorerModule: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts: Record<string, number> = {};
      await Promise.all(
        queriesData.map(async (q) => {
          const { count } = await supabase
            .from(q.table)
            .select('*', { count: 'exact', head: true });
          newCounts[q.id] = count || 0;
        })
      );
      setCounts(newCounts);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  if (activeModule) {
    const activeData = queriesData.find(q => q.id === activeModule);
    const Icon = activeData?.icon || Database;
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
        <button 
          onClick={() => setActiveModule(null)} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Explorador
        </button>
        
        <div className={`flex items-center gap-5 p-8 rounded-3xl border border-white/20 shadow-xl overflow-hidden relative ${activeData?.gradient || 'bg-slate-800'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

          <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 shadow-inner backdrop-blur-md border border-white/20`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white tracking-tight">Explorador de {activeData?.title}</h1>
            <p className="text-base font-medium text-white/80 mt-1">Vista detallada y análisis de registros.</p>
          </div>
        </div>
        
        <div className="w-full relative z-10">
          {activeModule === 'clientes' && <TableClientes />}
          {activeModule === 'campanas' && <TableCampaigns />}
          {activeModule === 'leads' && <TableLeads />}
          {activeModule === 'pagos' && <TablePagos />}
          {activeModule === 'chatbot' && <TableChatbot />}
          { activeModule === 'interacciones' && <TableInteracciones /> }
          { activeModule === 'publicaciones' && <TablePublicaciones /> }
          { activeModule === 'contenido_ia' && <TableContenidoIA /> }
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400" />
            Explorador de Datos
          </h1>
          <p className="text-blue-100/80 font-medium mt-2 text-base max-w-xl">Navega y analiza toda la información del sistema en tiempo real. Selecciona un módulo para visualizar los detalles estructurados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {queriesData.map((query) => {
          const Icon = query.icon;
          const count = counts[query.id];
          
          return (
            <button
              key={query.id}
              onClick={() => setActiveModule(query.id)}
              className={`group text-left relative p-7 ${query.gradient} rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden border border-white/20 ${query.shadow}`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
              
              <div className={`relative mb-6 inline-flex w-14 h-14 rounded-2xl items-center justify-center ${query.bg} shadow-inner backdrop-blur-md border border-white/20`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="relative text-xl font-black text-white mb-2 tracking-tight">
                {query.title}
              </h3>
              
              <div className="relative flex items-center gap-2">
                <div className="text-sm font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 group-hover:bg-white/30 transition-colors">
                  {loading ? (
                    <div className="h-4 w-16 bg-white/30 rounded animate-pulse inline-block" />
                  ) : (
                    <span className="text-white drop-shadow-md">{count?.toLocaleString() || 0}</span>
                  )}
                  <span className="ml-1.5 text-white/80 font-semibold">registros</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
