import React, { useState } from 'react';
import { FileText, DollarSign, Bot, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ReporteCampanas } from './tables/ReporteCampanas';
import { ReporteFinanciero } from './tables/ReporteFinanciero';
import { ReporteIA } from './tables/ReporteIA';
import { ReportePublicaciones } from './tables/ReportePublicaciones';
import { useUser } from '../../context/UserContext';

const reportesClienteData = [
  { id: 'campanas', title: 'Mis Campañas', description: 'Métricas y estado de tus campañas publicitarias.', icon: TrendingUp, iconColor: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'publicaciones', title: 'Mis Publicaciones', description: 'Tus publicaciones agendadas en redes sociales.', icon: FileText, iconColor: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'financiero', title: 'Mis Pagos', description: 'Historial de tus pagos y facturación.', icon: DollarSign, iconColor: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'ia', title: 'Contenido IA', description: 'Contenidos generados por la Inteligencia Artificial.', icon: Bot, iconColor: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export const CentroReportesCliente: React.FC = () => {
  const [activeReporte, setActiveReporte] = useState<string | null>(null);
  const { profile } = useUser();
  const userId = profile?.id_usuario;

  if (activeReporte) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
        {activeReporte === 'campanas' && <ReporteCampanas onBack={() => setActiveReporte(null)} defaultUserId={userId} />}
        {activeReporte === 'financiero' && <ReporteFinanciero onBack={() => setActiveReporte(null)} defaultUserId={userId} />}
        {activeReporte === 'ia' && <ReporteIA onBack={() => setActiveReporte(null)} defaultUserId={userId} />}
        {activeReporte === 'publicaciones' && <ReportePublicaciones onBack={() => setActiveReporte(null)} defaultUserId={userId} />}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Centro de Reportes
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Genera y descarga reportes de tu cuenta en PDF o Excel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportesClienteData.map((reporte) => {
          const Icon = reporte.icon;
          
          return (
            <button
              key={reporte.id}
              onClick={() => setActiveReporte(reporte.id)}
              className="group text-left relative p-6 bg-white rounded-2xl border border-slate-200 transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center ${reporte.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${reporte.iconColor}`} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {reporte.title}
              </h3>
              
              <p className="text-sm text-slate-500 mb-4 h-10">
                {reporte.description}
              </p>

              <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                Ver Reporte
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
