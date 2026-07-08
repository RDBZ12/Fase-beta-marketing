import React, { useState, useCallback } from 'react';
import { TrendingUp, FileText, Download } from 'lucide-react';
import { ReporteView } from '../ReporteView';
import { DataTable, type Column, type FetchDataParams } from '../../data-explorer/DataTable';
import { supabase } from '../../../supabaseClient';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { SidePanel } from '../../data-explorer/SidePanel';

interface Props {
  onBack: () => void;
  defaultUserId?: string;
}

export const ReporteCampanas: React.FC<Props> = ({ onBack, defaultUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchCampanas = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('campaigns').select('*', { count: 'exact' });

    if (defaultUserId) {
      query = query.eq('id_usuario', defaultUserId);
    }

    if (params.searchTerm) {
      query = query.or(`name.ilike.%${params.searchTerm}%,brand.ilike.%${params.searchTerm}%,channel.ilike.%${params.searchTerm}%`);
    }
    if (estadoFilter) {
      query = query.eq('status', estadoFilter);
    }
    if (dateRange.start) {
      query = query.gte('created_at', dateRange.start);
    }
    if (dateRange.end) {
      // Agregar 23:59:59 para incluir todo el día
      query = query.lte('created_at', dateRange.end + 'T23:59:59');
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = params.pageIndex * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }, [defaultUserId, estadoFilter, dateRange]);

  const fetchExportData = async () => {
    let fullQuery = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (defaultUserId) fullQuery = fullQuery.eq('id_usuario', defaultUserId);
    if (estadoFilter) fullQuery = fullQuery.eq('status', estadoFilter);
    if (dateRange.start) fullQuery = fullQuery.gte('created_at', dateRange.start);
    if (dateRange.end) fullQuery = fullQuery.lte('created_at', dateRange.end + 'T23:59:59');
    
    const { data, error } = await fullQuery;
    if (error) throw error;
    return data || [];
  };

  const exportColumns = [
    { header: 'Campaña', dataKey: 'nombre_campana' },
    { header: 'Marca', dataKey: 'brand' },
    { header: 'Canal', dataKey: 'canal' },
    { header: 'Estado', dataKey: 'estado' },
    { header: 'Fecha Creación', dataKey: 'created_at' }
  ];

  const handleRowAction = (item: any, action: 'view' | 'pdf' | 'excel', e: React.MouseEvent) => {
    e.stopPropagation();
    if (action === 'view') {
      setSelectedItem(item);
    } else if (action === 'pdf') {
      exportToPDF({
        title: `Reporte Individual: ${item.name}`,
        filename: `campana_${item.name}`,
        columns: exportColumns,
        data: [item]
      });
    } else if (action === 'excel') {
      exportToExcel({
        title: `Reporte Individual: ${item.name}`,
        filename: `campana_${item.name}`,
        columns: exportColumns,
        data: [item]
      });
    }
  };

  const columns: Column[] = [
    { header: 'Campaña', accessorKey: 'nombre_campana', sortable: true, cell: (item) => <div className="font-bold text-slate-800">{item.nombre_campana || item.name}</div> },
    { header: 'Canal', accessorKey: 'canal', sortable: true, cell: (item) => <span>{item.canal || item.channel || 'Multi'}</span> },
    { header: 'Estado', accessorKey: 'estado', sortable: true, cell: (item) => {
      const estado = item.estado || item.status || 'N/A';
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
          estado.toLowerCase() === 'activa' ? 'bg-emerald-100 text-emerald-700' :
          estado.toLowerCase() === 'pausada' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>{estado.toUpperCase()}</span>
      );
    }},
    { header: 'Fecha', accessorKey: 'created_at', sortable: true, cell: (item) => new Date(item.created_at).toLocaleDateString() },
    { header: 'Acciones', cell: (item) => (
      <div className="flex items-center gap-2">
        <button onClick={(e) => handleRowAction(item, 'view', e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver reporte">👁️</button>
        <button onClick={(e) => handleRowAction(item, 'pdf', e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Descargar PDF">📄</button>
        <button onClick={(e) => handleRowAction(item, 'excel', e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Descargar Excel">📊</button>
      </div>
    )}
  ];

  return (
    <>
      <ReporteView
        title={defaultUserId ? "Mis Campañas" : "Reporte de Campañas"}
        description="Resumen del rendimiento y estado de todas las campañas."
        icon={TrendingUp}
        onBack={onBack}
        onSearchChange={setSearchTerm}
        onDateChange={setDateRange}
        exportDataFetcher={fetchExportData}
        exportColumns={exportColumns}
        exportFilename="reporte_campanas"
        filters={
          <select 
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-600"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activa">Activas</option>
            <option value="pausada">Pausadas</option>
            <option value="finalizada">Finalizadas</option>
          </select>
        }
      >
        <DataTable
          columns={columns}
          fetchData={fetchCampanas}
          refreshTrigger={searchTerm + estadoFilter + dateRange.start + dateRange.end}
        />
      </ReporteView>

      <SidePanel isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalle de Campaña">
        {selectedItem && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">
              {selectedItem.nombre_campana || selectedItem.name}
            </h2>
            <p className="text-sm text-slate-500 capitalize">{selectedItem.canal || selectedItem.channel || 'Multi'}</p>
            
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles de la Campaña</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Marca</p>
                  <p className="font-medium text-slate-800">{selectedItem.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="font-medium text-slate-800 capitalize">{selectedItem.estado || selectedItem.status || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Contenido Generado</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2 bg-white p-3 rounded border border-slate-200">
                {selectedItem.generated_content || 'Sin contenido guardado.'}
              </p>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
