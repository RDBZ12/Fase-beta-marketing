import React, { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { ReporteView } from '../ReporteView';
import { DataTable, type Column, type FetchDataParams } from '../../data-explorer/DataTable';
import { supabase } from '../../../supabaseClient';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { SidePanel } from '../../data-explorer/SidePanel';

interface Props {
  onBack: () => void;
  defaultUserId?: string;
}

export const ReportePublicaciones: React.FC<Props> = ({ onBack, defaultUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [redSocialFilter, setRedSocialFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchPublicaciones = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('publicaciones').select('*, campaigns!inner(nombre_campana, id_usuario, id_cliente), redes_sociales(nombre_red)', { count: 'exact' });

    if (defaultUserId) {
      query = query.or(`id_usuario.eq.${defaultUserId},id_cliente.eq.${defaultUserId}`, { foreignTable: 'campaigns' });
    }

    if (params.searchTerm) {
      query = query.or(`contenido.ilike.%${params.searchTerm}%`);
    }
    if (redSocialFilter) {
      query = query.eq('redes_sociales.nombre_red', redSocialFilter);
    }
    if (dateRange.start) {
      query = query.gte('fecha_publicacion', dateRange.start);
    }
    if (dateRange.end) {
      query = query.lte('fecha_publicacion', dateRange.end + 'T23:59:59');
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('fecha_publicacion', { ascending: false });
    }

    const from = params.pageIndex * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }, [defaultUserId, redSocialFilter, dateRange]);

  const fetchExportData = async () => {
    let fullQuery = supabase.from('publicaciones').select('*, campaigns!inner(nombre_campana, id_usuario, id_cliente), redes_sociales(nombre_red)').order('fecha_publicacion', { ascending: false });
    if (defaultUserId) fullQuery = fullQuery.or(`id_usuario.eq.${defaultUserId},id_cliente.eq.${defaultUserId}`, { foreignTable: 'campaigns' });
    if (redSocialFilter) fullQuery = fullQuery.eq('redes_sociales.nombre_red', redSocialFilter);
    if (dateRange.start) fullQuery = fullQuery.gte('fecha_publicacion', dateRange.start);
    if (dateRange.end) fullQuery = fullQuery.lte('fecha_publicacion', dateRange.end + 'T23:59:59');
    
    const { data, error } = await fullQuery;
    if (error) throw error;
    
    return (data || []).map((item: any) => ({ 
      ...item, 
      nombre_campana: item.nombre_campana || item.campaigns?.nombre_campana || 'N/A',
      nombre_red: item.redes_sociales?.nombre_red || item.nombre_red || 'N/A',
      fecha_publicacion: item.fecha_publicacion || new Date().toISOString()
    }));
  };

  const exportColumns = [
    { header: 'Campaña', dataKey: 'nombre_campana' },
    { header: 'Red Social', dataKey: 'nombre_red' },
    { header: 'Título', dataKey: 'titulo' },
    { header: 'Estado', dataKey: 'estado' },
    { header: 'Fecha', dataKey: 'fecha_publicacion' }
  ];

  const handleRowAction = (item: any, action: 'view' | 'pdf' | 'excel', e: React.MouseEvent) => {
    e.stopPropagation();
    const exportItem = { 
      ...item, 
      nombre_campana: item.nombre_campana || item.campaigns?.nombre_campana || 'N/A',
      nombre_red: item.redes_sociales?.nombre_red || item.nombre_red || 'N/A',
      fecha_publicacion: item.fecha_publicacion || new Date().toISOString()
    };
    
    if (action === 'view') {
      setSelectedItem(item);
    } else if (action === 'pdf') {
      exportToPDF({ title: `Reporte Publicación: ${item.id_publicacion}`, filename: `publicacion`, columns: exportColumns, data: [exportItem] });
    } else if (action === 'excel') {
      exportToExcel({ title: `Reporte Publicación`, filename: `publicacion`, columns: exportColumns, data: [exportItem] });
    }
  };

  const columns: Column<any>[] = [
    { header: 'Red Social', accessorKey: 'nombre_red', sortable: true, cell: (item) => <div className="font-bold text-slate-800">{item.redes_sociales?.nombre_red || item.nombre_red || 'N/A'}</div> },
    { header: 'Campaña', accessorKey: 'campaigns', cell: (item) => <div className="text-sm font-medium">{item.nombre_campana || item.campaigns?.nombre_campana || 'N/A'}</div> },
    { header: 'Estado', accessorKey: 'estado', sortable: true, cell: (item) => (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
        item.estado?.toLowerCase() === 'publicada' ? 'bg-blue-100 text-blue-700' :
        item.estado?.toLowerCase() === 'programada' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-700'
      }`}>{item.estado?.toUpperCase() || 'N/A'}</span>
    )},
    { header: 'Fecha', accessorKey: 'fecha_publicacion', sortable: true, cell: (item) => {
      const f = item.fecha_publicacion || '';
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
        title={defaultUserId ? "Mis Publicaciones" : "Reporte de Publicaciones"}
        description="Listado de publicaciones generadas para redes sociales."
        icon={FileText}
        onBack={onBack}
        onSearchChange={setSearchTerm}
        onDateChange={setDateRange}
        exportDataFetcher={fetchExportData}
        exportColumns={exportColumns}
        exportFilename="reporte_publicaciones"
        filters={
          <select 
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-600"
            value={redSocialFilter}
            onChange={(e) => setRedSocialFilter(e.target.value)}
          >
            <option value="">Todas las redes</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Twitter">Twitter</option>
          </select>
        }
      >
        <DataTable columns={columns} fetchData={fetchPublicaciones} refreshTrigger={searchTerm + redSocialFilter + dateRange.start + dateRange.end} />
      </ReporteView>

      <SidePanel isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalles de Publicación" subtitle={selectedItem?.redes_sociales?.nombre_red || selectedItem?.nombre_red}>
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase">Contenido</p>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-2 bg-white p-4 rounded-lg border border-slate-200">
                {selectedItem.contenido || selectedItem.titulo || 'Sin contenido visualizable'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Red Social</p>
                <p className="font-bold text-slate-800 text-lg">{selectedItem.redes_sociales?.nombre_red || selectedItem.nombre_red}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Estado</p>
                <p className="font-medium text-slate-800">{selectedItem.estado}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Campaña</p>
                <p className="font-medium text-slate-800">{selectedItem.nombre_campana || selectedItem.campaigns?.nombre_campana || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Fecha</p>
                <p className="font-medium text-slate-800">{new Date(selectedItem.fecha_publicacion).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
