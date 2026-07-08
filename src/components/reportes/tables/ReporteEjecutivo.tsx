import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import { ReporteView } from '../ReporteView';
import { supabase } from '../../../supabaseClient';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

interface Metric {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface Props {
  onBack: () => void;
}

export const ReporteEjecutivo: React.FC<Props> = ({ onBack }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const [
          { count: leadsCount },
          { count: campanasCount },
          { data: pagosData },
          { count: iaCount }
        ] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'activa'),
          supabase.from('pagos').select('monto').eq('estado', 'completado'),
          supabase.from('contenido_ia').select('*', { count: 'exact', head: true })
        ]);

        const ingresosTotales = (pagosData || []).reduce((acc, curr) => acc + (curr.monto || 0), 0);

        setMetrics([
          { title: 'Leads Generados', value: leadsCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Ingresos Totales', value: ingresosTotales, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Campañas Activas', value: campanasCount || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Contenidos IA', value: iaCount || 0, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const exportData = metrics.map(m => ({ 
    metrica: m.title, 
    valor: m.title === 'Ingresos Totales' ? `$${m.value.toFixed(2)}` : m.value.toString()
  }));

  const exportColumns = [
    { header: 'Métrica Clave', dataKey: 'metrica' },
    { header: 'Valor Actual', dataKey: 'valor' }
  ];

  return (
    <ReporteView
      title="Reporte Ejecutivo"
      description="Vista de alto nivel del desempeño general."
      icon={Briefcase}
      onBack={onBack}
      exportDataFetcher={async () => exportData}
      exportColumns={exportColumns}
      exportFilename="reporte_ejecutivo"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Métricas de Alto Nivel</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className={`p-6 rounded-2xl border border-slate-100 ${metric.bg} relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-2">{metric.title}</p>
                      <h3 className={`text-3xl font-bold ${metric.color}`}>
                        {metric.title === 'Ingresos Totales' ? `$${metric.value.toFixed(2)}` : metric.value}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shadow-sm">
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Nota Ejecutiva</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Este reporte consolidado proporciona una vista en tiempo real de los KPIs de MarketIA. Puede exportar esta vista a PDF o Excel para presentaciones usando los botones superiores.
          </p>
        </div>
      </div>
    </ReporteView>
  );
};
