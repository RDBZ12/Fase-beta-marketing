import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, CheckCircle, AlertTriangle, Clock, Eye, X } from 'lucide-react';
import type { Campaign } from '../../types';

interface AdminCampanasModuleProps {
  campaigns: Campaign[];
  fetchCampaigns: () => Promise<void>;
}

export function AdminCampanasModule({ campaigns, fetchCampaigns }: AdminCampanasModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [pubDetails, setPubDetails] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterEstado]);

  const handleOpenModal = async (camp: any) => {
    setSelectedCamp(camp);
    setPubDetails(null);
    const { data } = await supabase
      .from('publicaciones')
      .select('imagen_url, contenido')
      .eq('id_campana', camp.id)
      .limit(1)
      .single();
    
    if (data) setPubDetails(data);
  };

  const handleApprove = async () => {
    if (!selectedCamp || !currentUser) return;
    setApproving(true);
    const { error } = await supabase
      .from('campaigns')
      .update({
        estado_moderacion: 'aprobada',
        aprobado_por: currentUser.id
      })
      .eq('id', selectedCamp.id);
    
    setApproving(false);
    if (!error) {
      setSelectedCamp(null);
      fetchCampaigns();
    } else {
      alert("Error al aprobar: " + error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedCamp || !currentUser) return;
    setRejecting(true);
    const { error } = await supabase
      .from('campaigns')
      .update({
        estado_moderacion: 'rechazada',
        aprobado_por: currentUser.id
      })
      .eq('id', selectedCamp.id);
    
    setRejecting(false);
    if (!error) {
      setSelectedCamp(null);
      fetchCampaigns();
    } else {
      alert("Error al rechazar: " + error.message);
    }
  };

  const [adminCampaigns, setAdminCampaigns] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminCampaignsServer();
  }, [page, pageSize, searchTerm, filterEstado, campaigns]); // campaigns triggers re-fetch on real-time updates

  const fetchAdminCampaignsServer = async () => {
    setLoading(true);
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (filterEstado !== 'todos') {
      if (filterEstado === 'pendiente') {
        query = query.or('estado_moderacion.eq.pendiente,estado_moderacion.is.null');
      } else {
        query = query.eq('estado_moderacion', filterEstado);
      }
    }
    
    if (searchTerm) {
      query = query.ilike('nombre_campana', `%${searchTerm}%`);
    }

    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, count, error } = await query;
    
    if (!error && data) {
      const creatorIds = [...new Set(data.map(c => c.id_usuario || c.id_cliente).filter(Boolean))];
      let usersMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const [{ data: teamData }, { data: clientsData }] = await Promise.all([
          supabase.from('usuarios').select('id_usuario, nombre, apellido').in('id_usuario', creatorIds),
          supabase.from('clientes_portal').select('auth_user_id, nombre, apellido').in('auth_user_id', creatorIds)
        ]);

        if (teamData) {
          teamData.forEach(u => usersMap[u.id_usuario] = `${u.nombre} ${u.apellido}`);
        }
        if (clientsData) {
          clientsData.forEach(c => usersMap[c.auth_user_id] = `${c.nombre} ${c.apellido}`);
        }
      }

      const mapped = data.map(c => {
        const cId = c.id_usuario || c.id_cliente;
        return {
          ...c,
          name: c.nombre_campana || 'Sin Nombre',
          creatorName: cId ? (usersMap[cId] || 'Desconocido') : 'Desconocido'
        };
      });
      setAdminCampaigns(mapped);
      if (count !== null) {
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        setTotalItems(count);
      }
    } else if (error) {
      console.error("Error fetching admin campaigns:", error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Moderación de Campañas</h2>
          <p className="text-slate-500">Revisa y aprueba campañas retenidas por IA.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o campaña..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>
          <select 
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full sm:w-48 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="necesita_revision">Necesita Revisión</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Cancelada (Rechazada)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Campaña</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Presupuesto (Inc. ITBIS)</th>
                <th className="px-6 py-4">Estado Moderación</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adminCampaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.creatorName}</td>
                  <td className="px-6 py-4 text-slate-600">${((c.presupuesto || 0) * 1.18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4">
                    {c.estado_moderacion === 'aprobada' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3"/> Aprobada</span>}
                    {c.estado_moderacion === 'necesita_revision' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-700"><AlertTriangle className="w-3 h-3"/> Revisión</span>}
                    {c.estado_moderacion === 'rechazada' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-red-100 text-red-700"><X className="w-3 h-3"/> Cancelada</span>}
                    {(!c.estado_moderacion || c.estado_moderacion === 'pendiente') && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600"><Clock className="w-3 h-3"/> Pendiente</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.estado_moderacion !== 'aprobada' && c.estado_moderacion !== 'rechazada' && (
                      <button 
                        onClick={() => handleOpenModal(c)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 ml-auto"
                      >
                        <Eye className="w-4 h-4"/> Ver y Aprobar
                      </button>
                    )}
                    {c.estado_moderacion === 'rechazada' && (
                      <span className="text-xs text-slate-400 font-medium italic">Bloqueada (Cancelada)</span>
                    )}
                  </td>
                </tr>
              ))}
              {adminCampaigns.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No hay campañas que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-slate-500">
              Mostrando <span className="font-bold text-slate-700">{(page * pageSize) + 1}</span> a <span className="font-bold text-slate-700">{Math.min((page + 1) * pageSize, totalItems)}</span> de <span className="font-bold text-slate-700">{totalItems}</span> registros
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Filas:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-1.5 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="text-sm font-medium text-slate-600 px-2">
                  Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || totalItems === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Revisión de Campaña</h3>
              <button onClick={() => setSelectedCamp(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-sm">
                <p className="font-bold mb-1">Razón de la IA (o error):</p>
                <p>{selectedCamp.resultado_moderacion?.razon || selectedCamp.resultado_moderacion?.error || 'Sin detalles'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2">Imagen Generada</p>
                  {pubDetails?.imagen_url ? (
                    <img src={pubDetails.imagen_url} alt="Campaña" className="w-full rounded-xl border border-slate-200" />
                  ) : (
                    <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">Cargando o sin imagen...</div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2">Copy Publicitario</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap h-full">
                    {pubDetails?.contenido || 'Cargando contenido...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setSelectedCamp(null)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-colors">
                Cerrar
              </button>
              <button onClick={handleReject} disabled={rejecting || approving} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                {rejecting ? 'Procesando...' : <X className="w-4 h-4"/>} 
                Cancelar Publicación
              </button>
              <button onClick={handleApprove} disabled={approving || rejecting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                {approving ? 'Procesando...' : <CheckCircle className="w-4 h-4"/>} 
                Aprobar Campaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
