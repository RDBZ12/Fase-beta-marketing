import React, { useState, useEffect } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type ContenidoIA } from '../../../types';
import { Bot, Calendar, Hash, Globe, FileText } from 'lucide-react';

export const TableContenidoIA: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ContenidoIA | null>(null);

  const columns: Column<ContenidoIA>[] = [
    {
      header: 'Tema / Canal',
      accessorKey: 'tema',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{item.tema || 'Sin tema'}</div>
            <div className="text-xs text-slate-500">{item.canal || 'Canal general'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Extracto de Respuesta',
      accessorKey: 'respuesta_ia',
      cell: (item) => (
        <div className="max-w-md truncate text-sm text-slate-600 font-medium">
          {item.respuesta_ia?.substring(0, 80) || 'Sin respuesta'}...
        </div>
      ),
    },
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: (item) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{new Date(item.fecha).toLocaleDateString()}</span>
        </div>
      ),
    }
  ];

  const fetchContenidoIA = async (params: FetchDataParams) => {
    let query = supabase
      .from('contenido_ia')
      .select('*', { count: 'exact' });

    if (params.globalFilter) {
      query = query.or(`tema.ilike.%${params.globalFilter}%,respuesta_ia.ilike.%${params.globalFilter}%,canal.ilike.%${params.globalFilter}%`);
    }

    if (params.sorting?.length) {
      const sort = params.sorting[0];
      query = query.order(sort.id, { ascending: !sort.desc });
    } else {
      query = query.order('fecha', { ascending: false });
    }

    const from = params.pageIndex * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data as ContenidoIA[],
      pageCount: count ? Math.ceil(count / params.pageSize) : 0,
    };
  };

  return (
    <div className="flex w-full gap-6 h-[calc(100vh-220px)]">
      <div className={`flex-1 transition-all duration-300 ${selectedItem ? 'w-2/3' : 'w-full'}`}>
        <DataTable 
          columns={columns} 
          fetchData={fetchContenidoIA}
          onRowClick={setSelectedItem}
          selectedRowId={selectedItem?.id_contenido}
        />
      </div>

      <SidePanel isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalles del Contenido IA">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-600">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedItem.tema || 'Contenido Generado'}</h3>
                <p className="text-sm font-medium text-slate-500">ID: {selectedItem.id_contenido.substring(0,8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Canal Objetivo</span>
                </div>
                <div className="font-semibold text-slate-800">{selectedItem.canal || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Fecha Generación</span>
                </div>
                <div className="font-semibold text-slate-800">{new Date(selectedItem.fecha).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-3">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Respuesta Completa de la IA</span>
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium bg-white p-4 rounded-lg border border-slate-200">
                {selectedItem.respuesta_ia}
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
};
