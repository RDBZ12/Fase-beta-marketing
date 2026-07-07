import React, { useState, useCallback } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type Lead } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { User, Mail, Phone, Calendar, Target, Flag } from 'lucide-react';

export const TableLeads: React.FC = () => {
  const { profile } = useUser();
  const [selectedItem, setSelectedItem] = useState<Lead | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  const fetchLeads = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    // Portal Cliente / RLS Simulado (Si es rol 5 o 4 y no es admin, solo ve lo suyo? 
    // Los leads tienen id_campana, que tiene idCliente. Esto requeriría un join, 
    // pero si la base de datos ya tiene id_cliente en leads o RLS, funcionará.
    // Asumiremos que dejamos el RLS de Supabase actuar o filtramos por lo que haya.

    if (params.searchTerm) {
      query = query.or(`nombre.ilike.%${params.searchTerm}%,correo.ilike.%${params.searchTerm}%,interes.ilike.%${params.searchTerm}%`);
    }

    if (estadoFilter) {
      query = query.eq('estado', estadoFilter);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('fecha_registro', { ascending: false });
    }

    query = query.range(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data: data as Lead[], count: count || 0 };
  }, [estadoFilter]);

  const columns: Column<Lead>[] = [
    {
      header: 'Nombre del Lead',
      accessorKey: 'nombre',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-800">{item.nombre}</div>
          <div className="text-xs text-slate-500">{item.correo || 'Sin correo'}</div>
        </div>
      )
    },
    {
      header: 'Interés',
      accessorKey: 'interes',
      sortable: true,
      cell: (item) => <span className="text-sm text-slate-600 truncate max-w-[200px] block">{item.interes || 'N/A'}</span>
    },
    {
      header: 'Campaña Asociada',
      accessorKey: 'nombre_campana',
      sortable: true,
      cell: (item) => <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{item.nombre_campana || 'General'}</span>
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      sortable: true,
      cell: (item) => {
        let bg = 'bg-slate-100 text-slate-700';
        if (item.estado === 'Nuevo') bg = 'bg-blue-100 text-blue-700 border-blue-200';
        if (item.estado === 'Contactado') bg = 'bg-purple-100 text-purple-700 border-purple-200';
        if (item.estado === 'Calificado') bg = 'bg-amber-100 text-amber-700 border-amber-200';
        if (item.estado === 'Convertido') bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (item.estado === 'Perdido') bg = 'bg-rose-100 text-rose-700 border-rose-200';
        
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
      <option value="Nuevo">Nuevo</option>
      <option value="Contactado">Contactado</option>
      <option value="Calificado">Calificado</option>
      <option value="Convertido">Convertido</option>
      <option value="Perdido">Perdido</option>
    </select>
  );

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchLeads} 
        filtersNode={filtersNode}
        onRowClick={(item) => setSelectedItem(item)}
        refreshTrigger={estadoFilter}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.nombre || ''}
        subtitle="Detalles del Lead"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Información de Contacto
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{selectedItem.correo || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{selectedItem.telefono || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Registrado: {new Date(selectedItem.fecha_registro).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Contexto de Captación
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Interés reportado</span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedItem.interes || 'Sin detalles adicionales proporcionados.'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Campaña de origen</span>
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-emerald-500" />
                    {selectedItem.nombre_campana || 'Tráfico Orgánico / Directo'}
                  </div>
                </div>
                {selectedItem.nombre_segmento && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Segmento</span>
                    <div className="text-sm font-medium text-slate-700">
                      {selectedItem.nombre_segmento}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Flag className="w-4 h-4 text-orange-500" />
                Estado del Lead
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Estado actual:</span>
                <span className="font-bold text-slate-800">{selectedItem.estado}</span>
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
};
