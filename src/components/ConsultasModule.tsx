import React, { useState } from 'react';
import { 
  Users, Megaphone, FileText, Bot, 
  MessageSquareHeart, BarChart3, Search, 
  TrendingUp, ArrowUpRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  TablaClientes, TablaCampaigns, TablaLeads, 
  TablaIA, TablaSentimientos, TablaInteracciones, TablaPublicaciones 
} from './consultas/TablasConsultas';

const queriesData = [
  { id: 'clientes', title: 'Consultas de Clientes', icon: Users, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
  { id: 'campanas', title: 'Consultas de Campañas', icon: Megaphone, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-500/30' },
  { id: 'leads', title: 'Consultas de Leads', icon: FileText, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-teal-500/30' },
  { id: 'ia', title: 'Contenido IA', icon: Bot, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-rose-500/30' },
  { id: 'sentimientos', title: 'Análisis de Sentimientos', icon: MessageSquareHeart, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/30' },
  { id: 'interacciones', title: 'Interacciones', icon: BarChart3, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30' },
  { id: 'publicaciones', title: 'Publicaciones', icon: TrendingUp, color: 'text-white', iconBg: 'bg-white/20', gradient: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/30' },
];

export const ConsultasModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchCounts = async () => {
      const getCount = async (table: string) => {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        return count || 0;
      };

      const [clientes, campanas, leads, ia, sentimientos, interacciones, publicaciones] = await Promise.all([
        getCount('usuarios'), // Mostrando usuarios como clientes temporalmente
        getCount('campaigns'),
        getCount('leads'),
        getCount('contenido_ia'),
        getCount('analisis_sentimientos'),
        getCount('interacciones'),
        getCount('publicaciones'),
      ]);

      setCounts({
        clientes, campanas, leads, ia, sentimientos, interacciones, publicaciones
      });
    };
    fetchCounts();
  }, []);

  if (activeQuery) {
    const queryInfo = queriesData.find(q => q.id === activeQuery);
    const Icon = queryInfo?.icon || Search;

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
        <button 
          onClick={() => setActiveQuery(null)} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Centro de Consultas
        </button>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${queryInfo?.gradient} shadow-lg ${queryInfo?.shadow}`}>
            <Icon className={`w-7 h-7 ${queryInfo?.color}`} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{queryInfo?.title}</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Viendo los datos detallados de este módulo.</p>
          </div>
        </div>
        
        {/* Renderizado Dinámico de Tablas Reales */}
        <div className="w-full relative z-10">
          {activeQuery === 'clientes' && <TablaClientes />}
          {activeQuery === 'campanas' && <TablaCampaigns />}
          {activeQuery === 'leads' && <TablaLeads />}
          {activeQuery === 'ia' && <TablaIA />}
          {activeQuery === 'sentimientos' && <TablaSentimientos />}
          {activeQuery === 'interacciones' && <TablaInteracciones />}
          {activeQuery === 'publicaciones' && <TablaPublicaciones />}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Centro de Consultas
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Explorador global de todos los datos del sistema.</p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            placeholder="Buscar en todos los módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {queriesData.map((query) => {
          const Icon = query.icon;
          const count = counts[query.id] !== undefined ? counts[query.id] : '...';
          
          let statsText = '';
          if (query.id === 'clientes') statsText = `${count} clientes totales`;
          if (query.id === 'campanas') statsText = `${count} campañas registradas`;
          if (query.id === 'leads') statsText = `${count} leads capturados`;
          if (query.id === 'ia') statsText = `${count} contenidos generados`;
          if (query.id === 'sentimientos') statsText = `${count} análisis realizados`;
          if (query.id === 'interacciones') statsText = `${count} registros totales`;
          if (query.id === 'publicaciones') statsText = `${count} publicaciones en total`;

          return (
            <button
              key={query.id}
              onClick={() => setActiveQuery(query.id)}
              className={`group text-left relative p-6 rounded-3xl bg-gradient-to-br ${query.gradient} transition-all duration-300 overflow-hidden shadow-lg ${query.shadow} hover:shadow-xl hover:-translate-y-1`}
            >
              {/* Top right icon */}
              <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                <ArrowUpRight className={`w-5 h-5 ${query.color}`} />
              </div>
              
              {/* Icon Container */}
              <div className="relative mb-6 inline-block">
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center ${query.iconBg} backdrop-blur-sm border border-white/20 shadow-inner`}>
                  <Icon className={`w-6 h-6 ${query.color}`} />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
                {query.title}
              </h3>
              
              <p className={`text-xs font-semibold text-white/80`}>
                {statsText}
              </p>

              {/* Decorative background circle */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
