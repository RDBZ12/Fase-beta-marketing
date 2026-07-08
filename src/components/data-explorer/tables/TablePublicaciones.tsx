import React, { useState, useCallback } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type Publicacion } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { Globe, Calendar, FileText, Image as ImageIcon, MessageCircle, Share2, ThumbsUp } from 'lucide-react';

export const TablePublicaciones: React.FC = () => {
  const { profile } = useUser();
  const [selectedItem, setSelectedItem] = useState<Publicacion | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  const fetchPublicaciones = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('publicaciones').select('*', { count: 'exact' });

    // En publicaciones, id_campana podría usarse para filtrar por cliente indirectamente si es necesario.
    // De momento lo mantenemos global o con el RLS si existe.

    if (params.searchTerm) {
      query = query.or(`titulo.ilike.%${params.searchTerm}%,estado.ilike.%${params.searchTerm}%,nombre_red.ilike.%${params.searchTerm}%,nombre_campana.ilike.%${params.searchTerm}%`);
    }

    if (estadoFilter) {
      query = query.eq('estado', estadoFilter);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('fecha_publicacion', { ascending: false });
    }

    query = query.range(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data: data as Publicacion[], count: count || 0 };
  }, [estadoFilter]);

  const columns: Column<Publicacion>[] = [
    {
      header: 'Título',
      accessorKey: 'titulo',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-800 truncate max-w-[200px]">{item.titulo}</div>
          <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.nombre_campana || 'Sin campaña'}</div>
        </div>
      )
    },
    {
      header: 'Red Social',
      accessorKey: 'nombre_red',
      sortable: true,
      cell: (item) => <span className="font-medium text-slate-600">{item.nombre_red || 'N/A'}</span>
    },
    {
      header: 'Fecha Prog.',
      accessorKey: 'fecha_publicacion',
      sortable: true,
      cell: (item) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">
          {new Date(item.fecha_publicacion).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      sortable: true,
      cell: (item) => {
        let bg = 'bg-slate-100 text-slate-700 border-slate-200';
        if (item.estado === 'Publicada') bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (item.estado === 'Programada') bg = 'bg-blue-100 text-blue-700 border-blue-200';
        if (item.estado === 'Cancelada') bg = 'bg-rose-100 text-rose-700 border-rose-200';
        if (item.estado === 'Borrador') bg = 'bg-amber-100 text-amber-700 border-amber-200';
        if (item.estado === 'Pendiente Aprobacion') bg = 'bg-purple-100 text-purple-700 border-purple-200';
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bg}`}>
            {item.estado}
          </span>
        );
      }
    }
  ];

  const filtersNode = (
    <select 
      value={estadoFilter} 
      onChange={(e) => setEstadoFilter(e.target.value)}
      className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2 outline-none font-medium shadow-sm"
    >
      <option value="">Todos los estados</option>
      <option value="Programada">Programada</option>
      <option value="Publicada">Publicada</option>
      <option value="Borrador">Borrador</option>
      <option value="Cancelada">Cancelada</option>
      <option value="Pendiente Aprobacion">Pendiente Aprobación</option>
    </select>
  );

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchPublicaciones} 
        filtersNode={filtersNode}
        onRowClick={(item) => setSelectedItem(item)}
        refreshTrigger={estadoFilter}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detalles de Publicación"
        subtitle={selectedItem?.titulo}
      >
        {selectedItem && (
          <div className="space-y-6">
            
            {/* Contenido Visual */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Contenido
              </h3>
              
              {selectedItem.imagen_url ? (
                <div className="mb-4 w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                  <img src={selectedItem.imagen_url} alt="Media" className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="mb-4 w-full h-24 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs font-medium">Sin imagen</span>
                </div>
              )}
              
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                {selectedItem.contenido}
              </div>
            </div>

            {/* Metadatos y Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  Distribución
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Red Social</span>
                    <span className="font-bold text-slate-800">{selectedItem.nombre_red || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tipo de Contenido</span>
                    <span className="text-sm font-medium text-slate-700">{selectedItem.nombre_tipo || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Campaña Asociada</span>
                    <span className="text-sm font-medium text-slate-700">{selectedItem.nombre_campana || 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 block">Estado</span>
                    <span className="font-bold text-slate-800">{selectedItem.estado}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    Métricas (Estimadas)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <ThumbsUp className="w-4 h-4 text-blue-500" /> Me gusta
                      </div>
                      <span className="font-bold text-slate-800">{selectedItem.likes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MessageCircle className="w-4 h-4 text-purple-500" /> Comentarios
                      </div>
                      <span className="font-bold text-slate-800">{selectedItem.comentarios || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Share2 className="w-4 h-4 text-emerald-500" /> Compartidos
                      </div>
                      <span className="font-bold text-slate-800">{selectedItem.compartidos || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Alcance Total</div>
                  <div className="text-2xl font-black text-slate-800">{selectedItem.alcance?.toLocaleString() || 0}</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
