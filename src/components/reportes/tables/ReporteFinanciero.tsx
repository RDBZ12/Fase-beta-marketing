import React, { useState, useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { ReporteView } from '../ReporteView';
import { DataTable, type Column, type FetchDataParams } from '../../data-explorer/DataTable';
import { supabase } from '../../../supabaseClient';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { SidePanel } from '../../data-explorer/SidePanel';

interface Props {
  onBack: () => void;
  defaultUserId?: string;
}

export const ReporteFinanciero: React.FC<Props> = ({ onBack, defaultUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchPagos = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('pagos').select('*, usuarios(nombre_completo, email)', { count: 'exact' });

    if (defaultUserId) {
      query = query.eq('id_usuario', defaultUserId);
    }

    if (params.searchTerm) {
      query = query.or(`metodo_pago.ilike.%${params.searchTerm}%,estado.ilike.%${params.searchTerm}%`);
    }
    if (estadoFilter) {
      query = query.eq('estado', estadoFilter);
    }
    if (dateRange.start) {
      query = query.gte('fecha', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('fecha', dateRange.end + 'T23:59:59');
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      // Usar fecha o fecha_pago si es necesario, pero tabla general usa fecha
      query = query.order('fecha', { ascending: false });
    }

    const from = params.pageIndex * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }, [defaultUserId, estadoFilter, dateRange]);

  const fetchExportData = async () => {
    let fullQuery = supabase.from('pagos').select('*, usuarios(nombre_completo, email)').order('fecha', { ascending: false });
    if (defaultUserId) fullQuery = fullQuery.eq('id_usuario', defaultUserId);
    if (estadoFilter) fullQuery = fullQuery.eq('estado', estadoFilter);
    if (dateRange.start) fullQuery = fullQuery.gte('fecha', dateRange.start);
    if (dateRange.end) fullQuery = fullQuery.lte('fecha', dateRange.end + 'T23:59:59');
    
    const { data, error } = await fullQuery;
    if (error) throw error;
    
    return (data || []).map(item => ({ 
      ...item, 
      cliente_nombre: item.usuarios?.nombre_completo || item.usuarios?.email || 'N/A',
      monto_final: item.monto || item.total_con_itbis || 0,
      fecha_final: item.fecha_pago || item.fecha || new Date().toISOString()
    }));
  };

  const exportColumns = [
    { header: 'ID Pago', dataKey: 'id_pago' },
    { header: 'Cliente', dataKey: 'cliente_nombre' },
    { header: 'Monto', dataKey: 'monto_final' },
    { header: 'Moneda', dataKey: 'moneda' },
    { header: 'Método', dataKey: 'metodo_pago' },
    { header: 'Estado', dataKey: 'estado' },
    { header: 'Fecha', dataKey: 'fecha_final' }
  ];

  const handleRowAction = (item: any, action: 'view' | 'pdf' | 'excel', e: React.MouseEvent) => {
    e.stopPropagation();
    const exportItem = { 
      ...item, 
      cliente_nombre: item.usuarios?.nombre_completo || item.usuarios?.email || 'N/A',
      monto_final: item.monto || item.total_con_itbis || 0,
      fecha_final: item.fecha_pago || item.fecha || new Date().toISOString()
    };
    
    if (action === 'view') {
      setSelectedItem(item);
    } else if (action === 'pdf') {
      exportToPDF({ title: `Reporte de Pago: ${item.id_pago}`, filename: `pago_${item.id_pago}`, columns: exportColumns, data: [exportItem] });
    } else if (action === 'excel') {
      exportToExcel({ title: `Reporte de Pago: ${item.id_pago}`, filename: `pago_${item.id_pago}`, columns: exportColumns, data: [exportItem] });
    }
  };

  const columns: Column[] = [
    { header: 'Monto', accessorKey: 'monto', sortable: true, cell: (item) => <div className="font-bold text-slate-800">${item.monto || item.total_con_itbis || 0} {item.moneda || 'USD'}</div> },
    { header: 'Cliente', accessorKey: 'usuarios', cell: (item) => <div className="text-sm font-medium">{item.usuarios?.nombre_completo || item.usuarios?.email || 'N/A'}</div> },
    { header: 'Método', accessorKey: 'metodo_pago', sortable: true },
    { header: 'Estado', accessorKey: 'estado', sortable: true, cell: (item) => (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
        item.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
        item.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      }`}>{item.estado?.toUpperCase()}</span>
    )},
    { header: 'Fecha', accessorKey: 'fecha_pago', sortable: true, cell: (item) => new Date(item.fecha_pago || item.fecha).toLocaleDateString() },
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
        title={defaultUserId ? "Mis Pagos" : "Reporte Financiero"}
        description="Listado y estado de pagos realizados."
        icon={DollarSign}
        onBack={onBack}
        onSearchChange={setSearchTerm}
        onDateChange={setDateRange}
        exportDataFetcher={fetchExportData}
        exportColumns={exportColumns}
        exportFilename="reporte_financiero"
        filters={
          <select 
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-600"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="completado">Completados</option>
            <option value="pendiente">Pendientes</option>
            <option value="fallido">Fallidos</option>
          </select>
        }
      >
        <DataTable columns={columns} fetchData={fetchPagos} refreshTrigger={searchTerm + estadoFilter + dateRange.start + dateRange.end} />
      </ReporteView>

      <SidePanel isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalles del Pago" subtitle={selectedItem?.id_pago}>
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Estado</p>
                <p className="font-medium text-slate-800">{selectedItem.estado}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Fecha de Pago</p>
                <p className="font-medium text-slate-800">{new Date(selectedItem.fecha_pago || selectedItem.fecha).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Cliente</p>
              <p className="font-medium text-slate-800">{selectedItem.usuarios?.nombre_completo || selectedItem.usuarios?.email}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Monto</p>
              <p className="font-medium text-slate-800">${selectedItem.monto || selectedItem.total_con_itbis || 0} {selectedItem.moneda || 'USD'}</p>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
