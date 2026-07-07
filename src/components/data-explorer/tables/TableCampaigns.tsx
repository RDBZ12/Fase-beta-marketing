import React, { useState, useCallback, useEffect } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type Campaign, type Usuario, type Publicacion, type Lead, type Pago } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { Tag, Calendar, User, BarChart, FileText, Share2, CreditCard, Users } from 'lucide-react';

export const TableCampaigns: React.FC = () => {
  const { profile } = useUser();
  const [selectedItem, setSelectedItem] = useState<Campaign | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  // Relational state
  const [dueño, setDueño] = useState<Usuario | null>(null);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setDueño(null);
      setPublicaciones([]);
      setLeads([]);
      setPagos([]);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const idCamp = selectedItem.id;
        const idCli = selectedItem.id_cliente || selectedItem.id_usuario;

        // Run queries in parallel
        const promises = [
          supabase.from('publicaciones').select('*').eq('id_campana', idCamp),
          supabase.from('leads').select('*').eq('id_campana', idCamp),
          supabase.from('pagos').select('*').eq('id_campana', idCamp),
        ];

        if (idCli) {
          promises.push(supabase.from('usuarios').select('*').eq('id_usuario', idCli).single());
        }

        const results = await Promise.all(promises);

        setPublicaciones((results[0].data || []) as Publicacion[]);
        setLeads((results[1].data || []) as Lead[]);
        setPagos((results[2].data || []) as Pago[]);
        
        if (idCli && results[3]) {
          setDueño((results[3].data || null) as Usuario);
        }

      } catch (error) {
        console.error("Error fetching campaign details:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedItem]);

  const fetchCampaigns = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('campaigns').select('*', { count: 'exact' });

    if (profile && profile.id_rol !== 1 && profile.id_rol !== 2) {
      query = query.or(`id_cliente.eq.${profile.id_usuario},id_usuario.eq.${profile.id_usuario}`);
    }

    if (params.searchTerm) {
      query = query.or(`nombre_campana.ilike.%${params.searchTerm}%,name.ilike.%${params.searchTerm}%,estado.ilike.%${params.searchTerm}%`);
    }

    if (estadoFilter) {
      query = query.eq('estado', estadoFilter);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data: data as Campaign[], count: count || 0 };
  }, [profile, estadoFilter]);

  const columns: Column<Campaign>[] = [
    {
      header: 'Campaña',
      accessorKey: 'nombre_campana',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-800">{item.nombre_campana || item.name}</div>
          <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{item.objetivo || item.descripcion || 'Sin descripción'}</div>
        </div>
      )
    },
    {
      header: 'Canal',
      accessorKey: 'channel',
      sortable: true,
      cell: (item) => <span className="text-slate-600 font-medium">{item.channel || 'Multi'}</span>
    },
    {
      header: 'Leads',
      accessorKey: 'leads',
      sortable: true,
      cell: (item) => <span className="font-mono font-bold text-blue-600">{item.leads || 0}</span>
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      sortable: true,
      cell: (item) => {
        let bg = 'bg-slate-100 text-slate-700';
        if (item.status === 'Activa' || item.estado === 'Activa') bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (item.status === 'Pausada' || item.estado === 'Pausada') bg = 'bg-amber-100 text-amber-700 border-amber-200';
        if (item.status === 'Pendiente de Pago' || item.estado === 'Pendiente de Pago') bg = 'bg-rose-100 text-rose-700 border-rose-200';
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bg}`}>
            {item.status || item.estado || 'N/A'}
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
      <option value="Activa">Activa</option>
      <option value="Pausada">Pausada</option>
      <option value="Completada">Completada</option>
      <option value="Pendiente de Pago">Pendiente de Pago</option>
    </select>
  );

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchCampaigns} 
        filtersNode={filtersNode}
        onRowClick={(item) => setSelectedItem(item)}
        refreshTrigger={estadoFilter}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.nombre_campana || selectedItem?.name || ''}
        subtitle="Detalles de la Campaña"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Tag className="w-4 h-4" />
                </div>
                Información General
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Estado</span>
                  <span className="font-bold text-slate-800">{selectedItem.status || selectedItem.estado}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Canal</span>
                  <span className="font-medium text-slate-700">{selectedItem.channel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Presupuesto</span>
                  <span className="font-mono text-emerald-600 font-bold">${selectedItem.presupuesto?.toLocaleString() || 0}</span>
                </div>
                
                {loadingDetails ? (
                   <div className="h-4 bg-slate-100 animate-pulse rounded w-1/2 ml-auto"></div>
                ) : (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 mt-2">
                    <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> Dueño / Cliente</span>
                    <span className="text-slate-700 font-semibold">{dueño ? `${dueño.nombre} ${dueño.apellido}` : selectedItem.creatorName || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-md transition-all group">
                    <div className="p-3 bg-emerald-50 rounded-xl mb-3 group-hover:bg-emerald-100 transition-colors">
                      <Users className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="text-3xl font-black text-slate-800">{leads.length}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Leads</span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-md transition-all group">
                    <div className="p-3 bg-blue-50 rounded-xl mb-3 group-hover:bg-blue-100 transition-colors">
                      <Share2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-3xl font-black text-slate-800">{publicaciones.length}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Publicaciones</span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    Pagos Recibidos ({pagos.length})
                  </h3>
                  {pagos.length === 0 ? (
                    <p className="text-xs text-slate-500">Esta campaña no tiene pagos registrados.</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {pagos.map(pago => (
                        <div key={pago.id_pago} className="p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all flex flex-col gap-2 group">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-slate-800 group-hover:text-amber-600 transition-colors">${pago.total_con_itbis?.toLocaleString() || pago.monto.toLocaleString()}</span>
                            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg shadow-sm border ${pago.estado_dgii === 'Aceptado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                              {pago.estado_dgii}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(pago.fecha).toLocaleDateString()} • {pago.metodo_pago}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    Fechas Programadas
                  </h3>
                  <div className="space-y-4">
                    <div className="text-sm flex justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-500">Inicio</span>
                      <span className="text-slate-700 font-semibold">{selectedItem.fechaInicio || selectedItem.startDate ? new Date(selectedItem.fechaInicio || selectedItem.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="text-sm flex justify-between">
                      <span className="text-slate-500">Fin</span>
                      <span className="text-slate-700 font-semibold">{selectedItem.fechaFin || selectedItem.endDate ? new Date(selectedItem.fechaFin || selectedItem.endDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </SidePanel>
    </>
  );
};
