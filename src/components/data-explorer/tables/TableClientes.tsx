import React, { useState, useCallback, useEffect } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type Usuario, type Campaign, type Pago } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { Building2, Mail, Phone, Calendar, BadgeCheck, FileText, Megaphone, CreditCard } from 'lucide-react';

export const TableClientes: React.FC = () => {
  const { profile } = useUser();
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  // Detalles relacionales
  const [campanasAsociadas, setCampanasAsociadas] = useState<Campaign[]>([]);
  const [pagosRealizados, setPagosRealizados] = useState<Pago[]>([]);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      setCampanasAsociadas([]);
      setPagosRealizados([]);
      setPortalInfo(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        // Fetch campañas del cliente
        const { data: camps } = await supabase
          .from('campaigns')
          .select('*')
          .or(`id_cliente.eq.${selectedUser.id_usuario},id_usuario.eq.${selectedUser.id_usuario}`);
        
        const { data: portal } = await supabase
          .from('clientes_portal')
          .select('whatsapp_phone')
          .eq('auth_user_id', selectedUser.id_usuario)
          .maybeSingle();
        
        setPortalInfo(portal);

        const campañas = (camps || []) as Campaign[];
        setCampanasAsociadas(campañas);

        // Fetch pagos asociados a esas campañas
        if (campañas.length > 0) {
          const campanaIds = campañas.map(c => c.id);
          const { data: pags } = await supabase
            .from('pagos')
            .select('*')
            .in('id_campana', campanaIds);
          setPagosRealizados((pags || []) as Pago[]);
        } else {
          setPagosRealizados([]);
        }

      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedUser]);

  const fetchClientes = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('usuarios').select('*', { count: 'exact' });

    if (profile && profile.id_rol !== 1 && profile.id_rol !== 2) {
      query = query.eq('id_usuario', profile.id_usuario);
    }

    if (params.searchTerm) {
      query = query.or(`nombre.ilike.%${params.searchTerm}%,apellido.ilike.%${params.searchTerm}%,correo.ilike.%${params.searchTerm}%`);
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
    
    let finalData = data as Usuario[];
    
    if (finalData.length > 0) {
      const userIds = finalData.map(u => u.id_usuario);
      const { data: portalData } = await supabase
        .from('clientes_portal')
        .select('auth_user_id, whatsapp_phone')
        .in('auth_user_id', userIds);
        
      if (portalData) {
        finalData = finalData.map(u => {
          const portal = portalData.find(p => p.auth_user_id === u.id_usuario);
          return {
            ...u,
            whatsapp_phone: u.whatsapp_phone || portal?.whatsapp_phone
          };
        });
      }
    }
    
    return { data: finalData, count: count || 0 };
  }, [profile, estadoFilter]);

  const columns: Column<Usuario>[] = [
    {
      header: 'Cliente / Usuario',
      accessorKey: 'nombre',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
            {item.nombre?.charAt(0)}{item.apellido?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-800">{item.nombre} {item.apellido}</div>
            <div className="text-xs text-slate-500">{item.correo}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Teléfono',
      accessorKey: 'telefono',
      cell: (item) => <span className="text-slate-600">{item.telefono || item.whatsapp_phone || 'N/A'}</span>
    },
    {
      header: 'Rol',
      accessorKey: 'id_rol',
      cell: (item) => (
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
          {item.id_rol === 1 ? 'Admin' : item.id_rol === 5 ? 'Cliente' : `Rol ${item.id_rol}`}
        </span>
      )
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      sortable: true,
      cell: (item) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.estado === 'activo' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
          {item.estado || 'N/A'}
        </span>
      )
    }
  ];

  const filtersNode = (
    <select 
      value={estadoFilter} 
      onChange={(e) => setEstadoFilter(e.target.value)}
      className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2 outline-none font-medium shadow-sm"
    >
      <option value="">Todos los estados</option>
      <option value="activo">Activos</option>
      <option value="inactivo">Inactivos</option>
    </select>
  );

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchClientes} 
        filtersNode={filtersNode}
        onRowClick={(item) => setSelectedUser(item)}
        refreshTrigger={estadoFilter}
      />

      <SidePanel
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`${selectedUser?.nombre} ${selectedUser?.apellido}`}
        subtitle="Detalles del Cliente"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                Información Personal
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">{selectedUser.correo}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">{selectedUser.telefono || selectedUser.whatsapp_phone || portalInfo?.whatsapp_phone || 'Sin registrar'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">Registro: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Desconocido'}</span>
                </div>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    Campañas Asociadas ({campanasAsociadas.length})
                  </h3>
                  {campanasAsociadas.length === 0 ? (
                    <p className="text-xs text-slate-500">Este cliente no tiene campañas activas.</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {campanasAsociadas.map(camp => (
                        <div key={camp.id} className="p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all flex items-center justify-between group">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">{camp.nombre_campana || camp.name || 'Sin título'}</span>
                          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm">{camp.estado || camp.status || 'Desconocido'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    Pagos Realizados ({pagosRealizados.length})
                  </h3>
                  {pagosRealizados.length === 0 ? (
                    <p className="text-xs text-slate-500">No hay pagos registrados para este cliente.</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {pagosRealizados.map(pago => (
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
              </>
            )}
          </div>
        )}
      </SidePanel>
    </>
  );
};
