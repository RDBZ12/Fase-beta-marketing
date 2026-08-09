import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, PlusCircle, RefreshCw, Trash2, Search, Calendar, ChevronLeft, ChevronRight, Eye, X, ArrowRight, CheckCircle, PauseCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  changed_at: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  creator_name?: string;
}

const actionConfig = {
  INSERT: { label: 'Creó', icon: PlusCircle, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  UPDATE: { label: 'Actualizó', icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100' },
  DELETE: { label: 'Eliminó', icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-100' },
};

export default function ClientAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const [filterText, setFilterText] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [dateTo, setDateTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // Update time every minute
    return () => clearInterval(interval);
  }, []);

  const getRecordName = (log: AuditLog) => {
    const data = log.action === 'DELETE' ? log.old_data : log.new_data;
    if (!data) return 'un registro';
    
    switch (log.table_name) {
      case 'campaigns': return `la campaña "${data.nombre_campana || data.name || 'Sin nombre'}"`;
      case 'publicaciones': return `la publicación "${data.titulo || 'Sin título'}"`;
      case 'leads': return `el prospecto "${data.nombre || 'Desconocido'}"`;
      case 'clientes_portal': return `el perfil de cliente`;
      case 'pagos': return `un pago por $${data.monto || '0'}`;
      default: return `un registro de ${log.table_name.replace(/_/g, ' ')}`;
    }
  };

  const getModuleName = (tableName: string) => {
    switch (tableName) {
      case 'campaigns': return 'CAMPAÑAS';
      case 'leads': return 'PROSPECTOS (LEADS)';
      case 'publicaciones': return 'PUBLICACIONES';
      case 'clientes_portal': return 'PERFIL DE CLIENTE';
      case 'pagos': return 'PAGOS';
      case 'usuarios': return 'USUARIOS DE EQUIPO';
      case 'interacciones': return 'MÉTRICAS / INTERACCIONES';
      default: return tableName.toUpperCase().replace(/_/g, ' ');
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval >= 1) return `hace ${Math.floor(interval)} min`;
    return 'hace unos segundos';
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, table_name, action, changed_at, old_data, new_data, user_id')
        .order('changed_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
        let usersMap: Record<string, string> = {};
        
        if (creatorIds.length > 0) {
          const [{ data: team }, { data: clients }] = await Promise.all([
            supabase.from('usuarios').select('id_usuario, nombre, apellido').in('id_usuario', creatorIds),
            supabase.from('clientes_portal').select('auth_user_id, nombre, apellido').in('auth_user_id', creatorIds)
          ]);
          if (team) team.forEach((u: any) => usersMap[u.id_usuario] = `${u.nombre || ''} ${u.apellido || ''}`.trim());
          if (clients) clients.forEach((c: any) => usersMap[c.auth_user_id] = `${c.nombre || ''} ${c.apellido || ''}`.trim());
        }

        const mappedData = data.map(log => ({
          ...log,
          creator_name: (log.user_id && usersMap[log.user_id] ? usersMap[log.user_id] : 'Sistema / Desconocido').replace(/\s*-\s*$/, '')
        }));
        setLogs(mappedData);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const recordName = getRecordName(log).toLowerCase();
      const authorName = (log.creator_name || '').toLowerCase();
      const search = filterText.toLowerCase();
      
      const matchText = filterText === '' || recordName.includes(search) || authorName.includes(search);
      
      const logDate = new Date(log.changed_at);
      const yyyy = logDate.getFullYear();
      const mm = String(logDate.getMonth() + 1).padStart(2, '0');
      const dd = String(logDate.getDate()).padStart(2, '0');
      const logDateString = `${yyyy}-${mm}-${dd}`;
      
      const matchDateFrom = dateFrom === '' || logDateString >= dateFrom;
      const matchDateTo = dateTo === '' || logDateString <= dateTo;
      
      return matchText && matchDateFrom && matchDateTo;
    });
  }, [logs, filterText, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentData = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Historial de Actividad
        </h2>
        <p className="text-sm text-gray-500 mt-1">Registro de tus acciones recientes en la plataforma.</p>
      </div>
      
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o autor..." 
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Desde:</span>
            <div className="relative w-full sm:w-auto flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Hasta:</span>
            <div className="relative w-full sm:w-auto flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {currentData.length === 0 ? (
          <div className="text-center text-gray-500 py-16 flex flex-col items-center gap-3 bg-gray-50 border-t border-gray-100">
            <Clock className="w-10 h-10 text-gray-300" />
            <p className="font-medium">No se encontraron registros de auditoría.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
                <th className="px-6 py-4 font-semibold">Módulo</th>
                <th className="px-6 py-4 font-semibold">Registro Afectado</th>
                <th className="px-6 py-4 font-semibold">Autor</th>
                <th className="px-6 py-4 font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {currentData.map((log) => {
                let config = actionConfig[log.action as keyof typeof actionConfig] || { label: log.action, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
                let isPayment = false;
                
                if (log.action === 'UPDATE' && log.table_name === 'campaigns' && log.old_data && log.new_data) {
                  const oldStatus = log.old_data.estado || log.old_data.status;
                  const newStatus = log.new_data.estado || log.new_data.status;
                  
                  const changesCount = Object.keys(log.new_data).filter(k => 
                    k !== 'updated_at' && k !== 'changed_at' && k !== 'estado' && k !== 'status' && 
                    JSON.stringify(log.new_data[k]) !== JSON.stringify(log.old_data[k])
                  ).length;
                  
                  if ((oldStatus !== newStatus && newStatus === 'Activa') || (newStatus === 'Activa' && changesCount === 0)) {
                    isPayment = true;
                    config = { label: 'Pago de Campaña', icon: CheckCircle, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' };
                  } else if (oldStatus !== newStatus && newStatus === 'Pausada') {
                    config = { label: 'Pausó', icon: PauseCircle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
                  }
                }
                
                const date = new Date(log.changed_at);
                
                let detailText = '';
                if (isPayment) {
                  const amount = log.new_data?.presupuesto || log.new_data?.budget || 0;
                  detailText = `Pagó USD $${Number(amount).toFixed(2)}`;
                } else if (log.action === 'INSERT') {
                  detailText = 'Nuevo registro creado';
                } else if (log.action === 'DELETE') {
                  detailText = 'Registro eliminado';
                } else if (log.action === 'UPDATE' && log.old_data && log.new_data) {
                  const changes = [];
                  for (const key in log.new_data) {
                    if (JSON.stringify(log.new_data[key]) !== JSON.stringify(log.old_data[key])) {
                      changes.push(key);
                    }
                  }
                  const filteredChanges = changes.filter(c => c !== 'updated_at' && c !== 'changed_at');
                  if (filteredChanges.length > 0) {
                    detailText = filteredChanges.length + ' campos modificados';
                  } else {
                    detailText = 'Sin cambios evidentes';
                  }
                }

                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-[13px]">
                          {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} 
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          config.label === 'Pago de Campaña' ? 'bg-purple-500' :
                          config.label === 'Pausó' ? 'bg-amber-500' :
                          log.action === 'INSERT' ? 'bg-emerald-500' :
                          log.action === 'UPDATE' ? 'bg-blue-500' :
                          'bg-rose-500'
                        }`} />
                        <span className={`text-[13px] font-medium ${
                          config.label === 'Pago de Campaña' ? 'text-purple-700' :
                          config.label === 'Pausó' ? 'text-amber-700' :
                          log.action === 'INSERT' ? 'text-emerald-700' :
                          log.action === 'UPDATE' ? 'text-blue-700' :
                          'text-rose-700'
                        }`}>
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[13px] text-gray-500 font-medium">
                        {getModuleName(log.table_name)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-800 text-[13px] line-clamp-2" title={getRecordName(log)}>
                        {getRecordName(log).replace(/^(el|la|un|una)\s+/i, '')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {log.creator_name ? log.creator_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">
                          {log.creator_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 font-medium text-xs transition-colors shadow-sm"
                        title="Ver detalle completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-500">
            Mostrando <span className="font-semibold text-gray-900">{filteredLogs.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> de <span className="font-semibold text-gray-900">{filteredLogs.length}</span> registros
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center">
              {currentPage} / {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Detalle de Actividad
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Encabezado del Modal */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Autor</span>
                    <span className="text-sm font-bold text-gray-800">{selectedLog.creator_name}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Fecha</span>
                    <span className="text-sm font-bold text-gray-800">{new Date(selectedLog.changed_at).toLocaleString('es-ES')}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Módulo</span>
                    <span className="inline-flex font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                      {getModuleName(selectedLog.table_name)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Acción</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedLog.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        selectedLog.action === 'UPDATE' ? (
                          (() => {
                            const oldS = selectedLog.old_data?.estado || selectedLog.old_data?.status;
                            const newS = selectedLog.new_data?.estado || selectedLog.new_data?.status;
                            const changesC = Object.keys(selectedLog.new_data || {}).filter(k => k !== 'updated_at' && k !== 'changed_at' && k !== 'estado' && k !== 'status' && JSON.stringify(selectedLog.new_data[k]) !== JSON.stringify(selectedLog.old_data?.[k])).length;
                            return (selectedLog.table_name === 'campaigns' && newS === 'Activa' && (oldS !== newS || changesC === 0)) ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200';
                          })()
                        ) :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {selectedLog.action === 'INSERT' ? 'CREACIÓN' : selectedLog.action === 'UPDATE' ? (
                        (() => {
                          const oldS = selectedLog.old_data?.estado || selectedLog.old_data?.status;
                          const newS = selectedLog.new_data?.estado || selectedLog.new_data?.status;
                          const changesC = Object.keys(selectedLog.new_data || {}).filter(k => k !== 'updated_at' && k !== 'changed_at' && k !== 'estado' && k !== 'status' && JSON.stringify(selectedLog.new_data[k]) !== JSON.stringify(selectedLog.old_data?.[k])).length;
                          return (selectedLog.table_name === 'campaigns' && newS === 'Activa' && (oldS !== newS || changesC === 0)) ? 'PAGO DE CAMPAÑA' : 'EDICIÓN';
                        })()
                      ) : 'ELIMINACIÓN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalle de Cambios (Antes y Después) */}
              <div>
                {selectedLog.action === 'INSERT' && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-sm text-gray-800 mb-4 border-b border-gray-100 pb-2">Valores iniciales del registro:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {Object.entries(selectedLog.new_data || {}).filter(([k]) => k !== 'updated_at').map(([key, val]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[10px] uppercase text-gray-500 font-bold bg-gray-50 self-start px-1.5 rounded">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-gray-800 mt-0.5 truncate" title={String(val)}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.action === 'DELETE' && (
                  <div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100">
                    <h4 className="font-semibold text-sm text-rose-800 mb-4 border-b border-rose-100 pb-2">Información que fue eliminada:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {Object.entries(selectedLog.old_data || {}).map(([key, val]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[10px] uppercase text-rose-500 font-bold bg-rose-50 self-start px-1.5 rounded">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-gray-800 mt-0.5 truncate" title={String(val)}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.action === 'UPDATE' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">Comparación de Cambios:</h4>
                    {(() => {
                      const changes = [];
                      for (const key in selectedLog.new_data) {
                        if (JSON.stringify(selectedLog.new_data[key]) !== JSON.stringify(selectedLog.old_data[key]) && key !== 'updated_at' && key !== 'changed_at') {
                          changes.push({ key, oldVal: selectedLog.old_data[key], newVal: selectedLog.new_data[key] });
                        }
                      }

                      if (changes.length === 0) return <p className="text-sm text-gray-500 italic">No se detectaron modificaciones sustanciales.</p>;

                      return changes.map(c => (
                        <div key={c.key} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                          <div className="w-full sm:w-1/4 pl-2">
                            <span className="text-[10px] uppercase text-gray-500 font-bold block">{c.key.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-100 gap-2">
                            <div className="flex-1 w-full text-center sm:text-left px-2">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Antes (Valor Viejo)</span>
                              <div className="text-sm text-rose-600 line-through opacity-80 break-all" title={String(c.oldVal)}>
                                {c.oldVal !== null && c.oldVal !== undefined && c.oldVal !== '' ? String(c.oldVal) : <span className="italic">Vacío</span>}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                            <div className="flex-1 w-full text-center sm:text-left px-2 bg-emerald-50/50 rounded py-1 border border-emerald-50">
                              <span className="block text-[9px] font-bold text-emerald-600/60 uppercase mb-0.5">Después (Valor Nuevo)</span>
                              <div className="text-sm font-semibold text-emerald-700 break-all" title={String(c.newVal)}>
                                {c.newVal !== null && c.newVal !== undefined && c.newVal !== '' ? String(c.newVal) : <span className="italic">Vacío</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm transition-colors shadow-sm focus:ring-4 focus:ring-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
