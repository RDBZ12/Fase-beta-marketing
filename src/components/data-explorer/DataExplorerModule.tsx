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
  { id: 'clientes', title: 'Clientes', icon: Users, iconColor: 'text-blue-600', bg: 'bg-blue-50', headerBg: 'bg-gradient-to-r from-blue-600 to-blue-800 shadow-blue-500/30', border: 'border-blue-700', table: 'usuarios' },
  { id: 'campanas', title: 'Campañas', icon: Megaphone, iconColor: 'text-purple-600', bg: 'bg-purple-50', headerBg: 'bg-gradient-to-r from-purple-600 to-purple-800 shadow-purple-500/30', border: 'border-purple-700', table: 'campaigns' },
  { id: 'leads', title: 'Leads', icon: FileText, iconColor: 'text-emerald-600', bg: 'bg-emerald-50', headerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-emerald-500/30', border: 'border-emerald-600', table: 'leads' },
  { id: 'pagos', title: 'Pagos', icon: DollarSign, iconColor: 'text-amber-600', bg: 'bg-amber-50', headerBg: 'bg-gradient-to-r from-amber-500 to-amber-700 shadow-amber-500/30', border: 'border-amber-600', table: 'pagos' },
  { id: 'chatbot', title: 'Historial Chatbot', icon: Bot, iconColor: 'text-pink-600', bg: 'bg-pink-50', headerBg: 'bg-gradient-to-r from-pink-500 to-pink-700 shadow-pink-500/30', border: 'border-pink-600', table: 'chatbot_historial' },
  { id: 'interacciones', title: 'Interacciones', icon: BarChart3, iconColor: 'text-orange-600', bg: 'bg-orange-50', headerBg: 'bg-gradient-to-r from-orange-500 to-orange-700 shadow-orange-500/30', border: 'border-orange-600', table: 'interacciones' },
  { id: 'publicaciones', title: 'Publicaciones', icon: TrendingUp, iconColor: 'text-cyan-600', bg: 'bg-cyan-50', headerBg: 'bg-gradient-to-r from-cyan-500 to-cyan-700 shadow-cyan-500/30', border: 'border-cyan-600', table: 'publicaciones' },
  { id: 'contenido_ia', title: 'Contenido IA', icon: Bot, iconColor: 'text-indigo-600', bg: 'bg-indigo-50', headerBg: 'bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-indigo-500/30', border: 'border-indigo-700', table: 'contenido_ia' },
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
        
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border ${activeData?.border || 'border-slate-800'} shadow-lg relative overflow-hidden ${activeData?.headerBg || 'bg-slate-800'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner border border-white/20`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Explorador de {activeData?.title}</h1>
              <p className="text-sm font-medium text-white/80 mt-0.5">Vista detallada y análisis de registros.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveModule(null)} 
            className="flex items-center justify-center gap-2 text-sm font-bold text-white hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm w-full md:w-auto relative z-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al menú
          </button>
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
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Explorador de Datos
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Navega y analiza toda la información del sistema. Selecciona un módulo para visualizar los detalles estructurados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {queriesData.map((query) => {
          const Icon = query.icon;
          const count = counts[query.id];
          
          return (
            <button
              key={query.id}
              onClick={() => setActiveModule(query.id)}
              className="group text-left relative p-6 bg-white rounded-2xl border border-slate-200 transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center ${query.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${query.iconColor}`} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {query.title}
              </h3>
              
              <div className="flex items-center text-sm">
                {loading ? (
                  <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <span className="font-bold text-slate-700">{count?.toLocaleString() || 0}</span>
                )}
                <span className="ml-1.5 text-slate-500 font-medium">registros</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
