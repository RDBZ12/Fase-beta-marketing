import React, { useState, useCallback } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { Bot, Calendar, User } from 'lucide-react';

export const TableChatbot: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const fetchChatbot = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('chatbot_historial').select('*', { count: 'exact' });

    if (params.searchTerm) {
      query = query.or(`mensaje.ilike.%${params.searchTerm}%,mensaje_usuario.ilike.%${params.searchTerm}%,respuesta.ilike.%${params.searchTerm}%,respuesta_bot.ilike.%${params.searchTerm}%`);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('created_at', { ascending: false });
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
      header: 'Mensaje Usuario',
      accessorKey: 'mensaje',
      cell: (item) => <div className="font-medium text-slate-800 max-w-xs truncate">{item.mensaje || item.mensaje_usuario || '...'}</div>
    },
    {
      header: 'Respuesta Bot',
      accessorKey: 'respuesta',
      cell: (item) => <div className="text-sm text-slate-600 max-w-sm truncate">{item.respuesta || item.respuesta_bot || '...'}</div>
    }
  ];

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchChatbot} 
        onRowClick={(item) => setSelectedItem(item)}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Historial de Chat"
        subtitle={selectedItem ? new Date(selectedItem.created_at || selectedItem.fecha).toLocaleString() : ''}
      >
        {selectedItem && (
          <div className="space-y-6">
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
              
              {/* Burbuja Usuario */}
              <div className="flex justify-end">
                <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      {selectedItem.mensaje || selectedItem.mensaje_usuario || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Burbuja Bot */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedItem.respuesta || selectedItem.respuesta_bot || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Marca de Tiempo
              </h3>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {new Date(selectedItem.created_at || selectedItem.fecha).toISOString()}
              </span>
            </div>

          </div>
        )}
      </SidePanel>
    </>
  );
};
