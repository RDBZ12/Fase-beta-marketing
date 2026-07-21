import React, { useState, useCallback } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { Activity, Calendar, MousePointerClick } from 'lucide-react';

export const TableInteracciones: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const fetchInteracciones = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('interacciones').select('*', { count: 'exact' });

    if (params.searchTerm) {
      query = query.or(`tipo_interaccion.ilike.%${params.searchTerm}%,tipo.ilike.%${params.searchTerm}%`);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('fecha', { ascending: false });
    }

    query = query.range(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data: data || [], count: count || 0 };
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      sortable: true,
      cell: (item) => (
        <span className="text-sm text-slate-500 whitespace-nowrap">
          {new Date(item.created_at || item.fecha || Date.now()).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Tipo de Acción',
      accessorKey: 'tipo_interaccion',
      sortable: true,
      cell: (item) => <span className="font-medium uppercase text-xs tracking-wider text-amber-500 bg-amber-50 px-2 py-1 rounded-md">{item.tipo_interaccion || item.tipo || 'Acción'}</span>
    },
    {
      header: 'Cantidad Generada',
      accessorKey: 'cantidad',
      sortable: true,
      cell: (item) => <span className="font-mono font-bold text-slate-800 text-lg">+{item.cantidad || item.count || 1}</span>
    }
  ];

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchInteracciones} 
        onRowClick={(item) => setSelectedItem(item)}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detalles de Interacción"
        subtitle={selectedItem ? new Date(selectedItem.created_at || selectedItem.fecha).toLocaleString() : ''}
      >
        {selectedItem && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Volumen Registrado
                </h3>
                <span className="text-xs text-slate-500">Cantidad de acciones agrupadas en este evento</span>
              </div>
              <div className="text-4xl font-black text-slate-800">
                +{selectedItem.cantidad || selectedItem.count || 1}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-blue-500" />
                Tipo de Evento
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Categoría</span>
                  <div className="font-bold text-slate-700 uppercase tracking-widest bg-slate-50 p-2 rounded-lg inline-block border border-slate-100">
                    {selectedItem.tipo_interaccion || selectedItem.tipo || 'General'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                Contexto Temporal
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono font-medium text-slate-700">{new Date(selectedItem.created_at || selectedItem.fecha).toISOString()}</span>
              </div>
            </div>

          </div>
        )}
      </SidePanel>
    </>
  );
};
