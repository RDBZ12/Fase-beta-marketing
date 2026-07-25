import React, { useState, useCallback, useEffect } from 'react';
import { DataTable, type Column, type FetchDataParams } from '../DataTable';
import { SidePanel } from '../SidePanel';
import { supabase } from '../../../supabaseClient';
import { type Pago, type Usuario, type Campaign } from '../../../types';
import { useUser } from '../../../context/UserContext';
import { DollarSign, Calendar, Building, FileText, CheckCircle2, QrCode } from 'lucide-react';

export const TablePagos: React.FC = () => {
  const { } = useUser();
  const [selectedItem, setSelectedItem] = useState<Pago | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  
  // Detalle relacional
  const [clienteAsociado, setClienteAsociado] = useState<Usuario | null>(null);
  const [campanaAsociada, setCampanaAsociada] = useState<Campaign | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!selectedItem || !selectedItem.id_campana) {
      setClienteAsociado(null);
      setCampanaAsociada(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const { data: camp } = await supabase.from('campaigns').select('*').eq('id', selectedItem.id_campana).single();
        if (camp) {
          setCampanaAsociada(camp as Campaign);
          if (camp.id_cliente || camp.id_usuario) {
            const { data: cli } = await supabase.from('usuarios').select('*').eq('id_usuario', camp.id_cliente || camp.id_usuario).single();
            setClienteAsociado((cli || null) as Usuario);
          } else {
            setClienteAsociado(null);
          }
        }
      } catch (error) {
        console.error("Error fetching payment details:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedItem]);

  const fetchPagos = useCallback(async (params: FetchDataParams) => {
    let query = supabase.from('pagos').select('*', { count: 'exact' });

    if (params.searchTerm) {
      query = query.or(`estado_dgii.ilike.%${params.searchTerm}%,metodo_pago.ilike.%${params.searchTerm}%,rnc_cedula.ilike.%${params.searchTerm}%,razon_social.ilike.%${params.searchTerm}%`);
    }

    if (estadoFilter) {
      query = query.eq('estado_dgii', estadoFilter);
    }

    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: !params.sortDesc });
    } else {
      query = query.order('fecha', { ascending: false });
    }

    query = query.range(params.pageIndex * params.pageSize, (params.pageIndex + 1) * params.pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return { data: data as Pago[], count: count || 0 };
  }, [estadoFilter]);

  const columns: Column<Pago>[] = [
    {
      header: 'Referencia / Fecha',
      accessorKey: 'fecha',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-slate-800">{new Date(item.fecha).toLocaleDateString()}</div>
          <div className="text-xs font-mono text-slate-400">ID: {item.id_pago?.slice(0, 8) || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Monto (DOP)',
      accessorKey: 'total_con_itbis',
      sortable: true,
      cell: (item) => {
        const dop = item.total_con_itbis || (item.monto ? item.monto * 1.18 : 0);
        return (
          <span className="font-mono font-bold text-slate-800">
            RD$ {dop.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      header: 'Monto (USD)',
      accessorKey: 'monto',
      sortable: true,
      cell: (item) => {
        const dop = item.total_con_itbis || (item.monto ? item.monto * 1.18 : 0);
        const usd = dop / 59.00;
        return (
          <span className="font-mono font-medium text-slate-500">
            US$ {usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      header: 'Método',
      accessorKey: 'metodo_pago',
      sortable: true,
      cell: (item) => <span className="text-sm font-medium text-slate-600">{item.metodo_pago}</span>
    },
    {
      header: 'Estado DGII',
      accessorKey: 'estado_dgii',
      sortable: true,
      cell: (item) => {
        let bg = 'bg-slate-100 text-slate-700';
        if (item.estado_dgii === 'Aceptado') bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (item.estado_dgii === 'Pendiente') bg = 'bg-amber-100 text-amber-700 border-amber-200';
        if (item.estado_dgii === 'Rechazado') bg = 'bg-rose-100 text-rose-700 border-rose-200';
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bg}`}>
            {item.estado_dgii || 'N/A'}
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
      <option value="Aceptado">Aceptado</option>
      <option value="Pendiente">Pendiente</option>
      <option value="Rechazado">Rechazado</option>
    </select>
  );

  return (
    <>
      <DataTable 
        columns={columns} 
        fetchData={fetchPagos} 
        filtersNode={filtersNode}
        onRowClick={(item) => setSelectedItem(item)}
        refreshTrigger={estadoFilter}
      />

      <SidePanel
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detalles del Pago"
        subtitle={`Referencia: ${selectedItem?.id_pago}`}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Desglose Financiero
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal (DOP)</span>
                  <span className="font-mono text-slate-700 font-medium">RD$ {Number(selectedItem.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">ITBIS (18% DOP)</span>
                  <span className="font-mono text-slate-700 font-medium">RD$ {Number(selectedItem.itbis || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Total pagado</span>
                  <div className="text-right">
                    <span className="font-mono text-slate-850 font-black text-lg block">RD$ {Number(selectedItem.total_con_itbis || selectedItem.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    <span className="font-mono text-emerald-600 font-semibold text-xs block">US$ {((selectedItem.total_con_itbis || selectedItem.monto || 0) / 59.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-500" />
                Datos de Facturación (DGII)
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Razón Social</span>
                  <div className="font-medium text-slate-800">{selectedItem.razon_social || 'Consumidor Final'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">RNC / Cédula</span>
                    <div className="font-mono text-sm text-slate-700">{selectedItem.rnc_cedula || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Comprobante</span>
                    <div className="text-sm font-medium text-slate-700">{selectedItem.tipo_comprobante || 'N/A'}</div>
                  </div>
                </div>
                {selectedItem.ncf && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">NCF Emitido</span>
                    <div className="font-mono text-sm text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 inline-block">
                      {selectedItem.ncf}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-slate-600">Estado DGII:</span>
                  <span className="font-bold text-slate-800">{selectedItem.estado_dgii}</span>
                </div>
                
                {/* Simulated QR/Receipt action */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <QrCode className="w-4 h-4" /> Ver Código QR
                  </button>
                  <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <FileText className="w-4 h-4" /> Comprobante PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Contexto Adicional
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Fecha del pago: {new Date(selectedItem.fecha).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Método de pago: {selectedItem.metodo_pago}</span>
                </div>
                
                {loadingDetails ? (
                  <div className="h-10 bg-slate-100 animate-pulse rounded mt-4"></div>
                ) : (
                  <>
                    {campanaAsociada && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs text-slate-500 block mb-1">Campaña Asociada</span>
                        <div className="font-semibold text-slate-800">{(campanaAsociada as any).nombre_campana || campanaAsociada.name || 'Sin título'}</div>
                      </div>
                    )}
                    {clienteAsociado && (
                      <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {clienteAsociado.nombre?.charAt(0)}{clienteAsociado.apellido?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Pagado por</div>
                          <div className="font-semibold text-slate-800">{clienteAsociado.nombre} {clienteAsociado.apellido}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>

          </div>
        )}
      </SidePanel>
    </>
  );
};
