import React, { useState, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { ReporteView } from '../ReporteView';
import { DataTable, type Column, type FetchDataParams } from '../../data-explorer/DataTable';
import { supabase } from '../../../supabaseClient';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { SidePanel } from '../../data-explorer/SidePanel';

interface Props {
  onBack: () => void;
  defaultUserId?: string;
}

export const ReporteIA: React.FC<Props> = ({ onBack, defaultUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [canalFilter, setCanalFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchContenido = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('contenido_ia').select('*, usuarios(nombre, apellido, correo)', { count: 'exact' });

    if (defaultUserId) {
      query = query.eq('id_usuario', defaultUserId);
    }

    if (params.searchTerm) {
      query = query.or(`tema.ilike.%${params.searchTerm}%,canal.ilike.%${params.searchTerm}%`);
    }
    if (canalFilter) {
      query = query.eq('canal', canalFilter);
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
      query = query.order('fecha', { ascending: false });
    }

    const from = params.pageIndex * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }, [defaultUserId, canalFilter, dateRange]);

  const fetchExportData = async () => {
    let fullQuery = supabase.from('contenido_ia').select('*, usuarios(nombre, apellido, correo)').order('fecha', { ascending: false });
    if (defaultUserId) fullQuery = fullQuery.eq('id_usuario', defaultUserId);
    if (canalFilter) fullQuery = fullQuery.eq('canal', canalFilter);
    if (dateRange.start) fullQuery = fullQuery.gte('fecha', dateRange.start);
    if (dateRange.end) fullQuery = fullQuery.lte('fecha', dateRange.end + 'T23:59:59');
    
    const { data, error } = await fullQuery;
    if (error) throw error;
    
    return (data || []).map((item: any) => ({ 
      ...item, 
      cliente_nombre: item.usuarios ? `${item.usuarios.nombre || ''} ${item.usuarios.apellido || ''}`.trim() || item.usuarios.correo : 'N/A' 
    }));
  };

  const exportColumns = [
    { header: 'Tema', dataKey: 'tema' },
    { header: 'Canal', dataKey: 'canal' },
    { header: 'Respuesta IA', dataKey: 'respuesta_ia' },
    { header: 'Usuario', dataKey: 'cliente_nombre' },
    { header: 'Fecha', dataKey: 'fecha' }
  ];

  const handleRowAction = (item: any, action: 'view' | 'pdf' | 'excel', e: React.MouseEvent) => {
    e.stopPropagation();
    const exportItem = { ...item, cliente_nombre: item.usuarios ? `${item.usuarios.nombre || ''} ${item.usuarios.apellido || ''}`.trim() || item.usuarios.correo : 'N/A' };
    
    if (action === 'view') {
      setSelectedItem(item);
    } else if (action === 'pdf') {
      exportToPDF({ title: `Reporte de IA: ${item.tema || 'Contenido'}`, filename: `ia_contenido`, columns: exportColumns, data: [exportItem] });
    } else if (action === 'excel') {
      exportToExcel({ title: `Reporte de IA`, filename: `ia_contenido`, columns: exportColumns, data: [exportItem] });
    }
  };

  const columns: Column<any>[] = [
    { header: 'Tema / Canal', accessorKey: 'tema', sortable: true, cell: (item) => (
      <div>
        <div className="font-semibold text-slate-800">{item.tema || 'Sin tema'}</div>
        <div className="text-xs text-slate-500">{item.canal || 'Canal general'}</div>
      </div>
    )},
    { header: 'Extracto', accessorKey: 'respuesta_ia', cell: (item) => (
      <div className="max-w-md truncate text-sm text-slate-600 font-medium">{item.respuesta_ia?.substring(0, 80) || 'Sin respuesta'}...</div>
    )},
    { header: 'Usuario', accessorKey: 'usuarios', cell: (item) => <div className="text-sm font-medium">{item.usuarios ? `${item.usuarios.nombre || ''} ${item.usuarios.apellido || ''}`.trim() || item.usuarios.correo : 'N/A'}</div> },
    { header: 'Fecha', accessorKey: 'fecha', sortable: true, cell: (item) => {
      const f = item.fecha || '';
      if (!f) return '';
      return f.includes('T') ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } },
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
        title="Reporte de Contenido IA"
        description="Textos y recursos generados a través de inteligencia artificial."
        icon={Bot}
        onBack={onBack}
        onSearchChange={setSearchTerm}
        onDateChange={setDateRange}
        exportDataFetcher={fetchExportData}
        exportColumns={exportColumns}
        exportFilename="reporte_ia"
        filters={
          <select 
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-600"
            value={canalFilter}
            onChange={(e) => setCanalFilter(e.target.value)}
          >
            <option value="">Todos los canales</option>
            <option value="Blog">Blog</option>
            <option value="Redes Sociales">Redes Sociales</option>
            <option value="Email">Email</option>
            <option value="SEO">SEO</option>
          </select>
        }
      >
        <DataTable columns={columns} fetchData={fetchContenido} refreshTrigger={searchTerm + canalFilter + dateRange.start + dateRange.end} />
      </ReporteView>

      <SidePanel isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Contenido Generado" subtitle={selectedItem?.tema}>
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Respuesta de la IA</p>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium mt-2 bg-white p-4 rounded-lg border border-slate-200">
                {selectedItem.respuesta_ia}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Canal</p>
                <p className="font-medium text-slate-800">{selectedItem.canal || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Fecha</p>
                <p className="font-medium text-slate-800">{new Date(selectedItem.fecha).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
