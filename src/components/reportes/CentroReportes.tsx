import React, { useState } from 'react';
import { FileText, DollarSign, Bot, TrendingUp, Briefcase, ArrowUpRight, Database } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ReporteView } from './ReporteView';
import { ReporteCampanas } from './tables/ReporteCampanas';
import { ReporteFinanciero } from './tables/ReporteFinanciero';
import { ReporteIA } from './tables/ReporteIA';
import { ReportePublicaciones } from './tables/ReportePublicaciones';
import { ReporteEjecutivo } from './tables/ReporteEjecutivo';

const reportesData = [
  { id: 'campanas', title: 'Reporte de Campañas', description: 'Métricas y estado de campañas publicitarias.', icon: TrendingUp, iconColor: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'financiero', title: 'Reporte Financiero', description: 'Historial de pagos, ingresos y presupuestos.', icon: DollarSign, iconColor: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'ia', title: 'Reporte de IA', description: 'Contenidos generados por la Inteligencia Artificial.', icon: Bot, iconColor: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'publicaciones', title: 'Reporte de Publicaciones', description: 'Publicaciones agendadas y en redes sociales.', icon: FileText, iconColor: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'ejecutivo', title: 'Reporte Ejecutivo', description: 'Resumen consolidado de métricas clave del sistema.', icon: Briefcase, iconColor: 'text-purple-600', bg: 'bg-purple-50' },
];

export const CentroReportes: React.FC = () => {
  const [activeReporte, setActiveReporte] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateData = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Debes iniciar sesión");

      // Generate Pagos
      const pagos = [];
      for (let i = 0; i < 15; i++) {
        pagos.push({
          id_usuario: user.id,
          monto: Math.floor(Math.random() * 500) + 50,
          moneda: 'USD',
          metodo_pago: Math.random() > 0.5 ? 'PayPal' : 'Tarjeta de Crédito',
          estado: Math.random() > 0.3 ? 'completado' : 'pendiente',
          fecha_pago: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      await supabase.from('pagos').insert(pagos);

      // Generate IA
      const contenidos = [];
      const temas = ['Campaña de Verano', 'Promoción VIP', 'Lanzamiento', 'Newsletter'];
      for (let i = 0; i < 15; i++) {
        contenidos.push({
          id_usuario: user.id,
          id_prompt: `prompt-mock-${Date.now()}-${i}`,
          tema: temas[Math.floor(Math.random() * temas.length)],
          canal: 'Instagram',
          respuesta_ia: `Texto generado de prueba para ${temas[Math.floor(Math.random() * temas.length)]}. ¡Aprovecha la oferta!`,
          fecha: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      await supabase.from('contenido_ia').insert(contenidos);

      // Generate Publicaciones
      const { data: camps } = await supabase.from('campaigns').select('id').eq('id_usuario', user.id);
      if (camps && camps.length > 0) {
        const publicaciones = [];
        const redes = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter'];
        for (let i = 0; i < 15; i++) {
          const camp = camps[Math.floor(Math.random() * camps.length)];
          const estado = Math.random() > 0.4 ? 'publicada' : (Math.random() > 0.5 ? 'programada' : 'borrador');
          publicaciones.push({
            id_campana: camp.id,
            id_usuario: user.id,
            red_social: redes[Math.floor(Math.random() * redes.length)],
            contenido: `Post automatizado para redes sociales. #post${i}`,
            estado: estado,
            fecha_programada: new Date(Date.now() + (estado === 'programada' ? Math.floor(Math.random() * 10) : -Math.floor(Math.random() * 10)) * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        await supabase.from('publicaciones').insert(publicaciones);
      }

      alert("Datos generados con éxito. Refresca los reportes.");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeReporte) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
        {activeReporte === 'campanas' && <ReporteCampanas onBack={() => setActiveReporte(null)} />}
        {activeReporte === 'financiero' && <ReporteFinanciero onBack={() => setActiveReporte(null)} />}
        {activeReporte === 'ia' && <ReporteIA onBack={() => setActiveReporte(null)} />}
        {activeReporte === 'publicaciones' && <ReportePublicaciones onBack={() => setActiveReporte(null)} />}
        {activeReporte === 'ejecutivo' && <ReporteEjecutivo onBack={() => setActiveReporte(null)} />}
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
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm max-w-2xl">
            Genera y descarga reportes del sistema en PDF o Excel.
          </p>
          <button 
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="flex items-center gap-2 text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200"
          >
            <Database className="w-4 h-4" />
            {isGenerating ? 'Generando...' : 'Autocompletar Datos Vacíos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportesData.map((reporte) => {
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
