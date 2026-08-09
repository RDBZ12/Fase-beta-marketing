import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Eye, ChevronLeft, ChevronRight, FileJson, X, Database, Clock, ShieldAlert, RefreshCw, Calendar } from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  old_data: any;
  new_data: any;
  user_id: string;
  creator_name?: string;
  changed_at: string;
}

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

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterTable, setFilterTable] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [dateTo, setDateTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterTable, filterAction, dateFrom, dateTo]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (filterTable) {
        query = query.ilike('table_name', `%${filterTable}%`);
      }
      if (filterAction) {
        query = query.eq('action', filterAction);
      }
      if (dateFrom) {
        const localStart = new Date(dateFrom + 'T00:00:00').toISOString();
        query = query.gte('changed_at', localStart);
      }
      if (dateTo) {
        const localEnd = new Date(dateTo + 'T23:59:59').toISOString();
        query = query.lte('changed_at', localEnd);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query
        .order('changed_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      if (count !== null) setTotalRecords(count);
      
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
          creator_name: log.user_id && usersMap[log.user_id] ? usersMap[log.user_id] : 'Sistema / Desconocido'
        }));
        setLogs(mappedData);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching admin logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const currentData = logs;

  const JsonViewer = ({ data, title }: { data: any, title: string }) => (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-inner flex flex-col h-full border border-[#2d2d2d]">
      <div className="bg-[#252526] px-4 py-2.5 border-b border-[#3c3c3c] flex justify-between items-center">
        <span className="text-xs font-mono text-[#d4d4d4] font-semibold uppercase tracking-wider">{title}</span>
        <FileJson className="w-4 h-4 text-[#858585]" />
      </div>
      <div className="p-4 overflow-auto max-h-[500px] text-sm flex-1">
        {data ? (
          <pre className="text-[#ce9178] font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span className="text-[#608b4e] italic text-sm">/* Sin datos */</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Auditoría Global
          </h2>
          <p className="text-sm text-gray-500 mt-1">Inspección de registros de la base de datos (Admin)</p>
        </div>
        
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-end">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar tabla (ej: leads)..." 
              value={filterTable}
              onChange={(e) => { setFilterTable(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <select 
              className="w-full sm:w-auto text-sm border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700 font-medium shadow-sm border"
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todas las acciones</option>
              <option value="INSERT">INSERT (Crear)</option>
              <option value="UPDATE">UPDATE (Actualizar)</option>
              <option value="DELETE">DELETE (Eliminar)</option>
              <option value="LOGIN">LOGIN (Inicio Sesión)</option>
              <option value="LOGOUT">LOGOUT (Cierre Sesión)</option>
            </select>
            
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
            
            <div className="flex items-center gap-1 border-l border-gray-200 pl-3 ml-1">
              {(dateFrom || dateTo) && (
                <button 
                  onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Limpiar fechas"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => { setLoading(true); fetchLogs(); }}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Refrescar historial"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Usuario / Autor</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
                <th className="px-6 py-4 font-semibold">Tabla</th>
                <th className="px-6 py-4 font-semibold text-right">Detalles JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <Database className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    No se encontraron registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                currentData.map((log) => {
                  let smartAction = log.action;
                  let badgeClass = '';
                  
                  if (log.action === 'UPDATE' && log.table_name === 'campaigns' && log.old_data && log.new_data) {
                    const oldS = log.old_data.estado || log.old_data.status;
                    const newS = log.new_data.estado || log.new_data.status;
                    const changesC = Object.keys(log.new_data).filter(k => k !== 'updated_at' && k !== 'changed_at' && k !== 'estado' && k !== 'status' && JSON.stringify(log.new_data[k]) !== JSON.stringify(log.old_data[k])).length;
                    
                    if ((oldS !== newS && newS === 'Activa') || (newS === 'Activa' && changesC === 0)) {
                      smartAction = 'PAGO DE CAMPAÑA';
                    } else if (oldS !== newS && newS === 'Pausada') {
                      smartAction = 'PAUSÓ CAMPAÑA';
                    }
                  }

                  if (smartAction === 'PAGO DE CAMPAÑA') {
                    badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                  } else if (smartAction === 'PAUSÓ CAMPAÑA') {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (log.action === 'INSERT') {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (log.action === 'UPDATE') {
                    badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else if (log.action === 'DELETE') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (log.action === 'LOGIN') {
                    badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                  } else if (log.action === 'LOGOUT') {
                    badgeClass = 'bg-gray-100 text-gray-700 border-gray-300';
                  } else {
                    badgeClass = 'bg-slate-50 text-slate-700 border-slate-200';
                  }

                  return (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">
                          {new Date(log.changed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.changed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">
                          {log.creator_name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono" title={log.user_id}>
                          {log.user_id?.substring(0, 8)}...{log.user_id?.substring(log.user_id.length - 4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${badgeClass}`}>
                        {smartAction}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-100 tracking-wider shadow-sm uppercase">
                        {getModuleName(log.table_name)}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 font-medium text-xs transition-colors shadow-sm group-hover:border-indigo-200"
                        title="Ver detalles JSON"
                      >
                        <Eye className="w-4 h-4" />
                        Revisar
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/80">
            <span className="text-sm text-gray-500">
              Mostrando <span className="font-semibold text-gray-900">{totalRecords === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalRecords)}</span> de <span className="font-semibold text-gray-900">{totalRecords}</span> registros
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start sm:items-center bg-gray-50/80 flex-col sm:flex-row gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  Inspección de Registro
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border shadow-sm ${
                        selectedLog.action === 'INSERT' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        selectedLog.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                    {selectedLog.action}
                  </span>
                </h3>
                <div className="text-sm text-gray-500 mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <span className="flex items-center gap-1.5">
                    Tabla: <strong className="text-indigo-700 font-bold text-[10px] uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{getModuleName(selectedLog.table_name)}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Autor: <strong className="text-gray-700 font-semibold text-sm">{selectedLog.creator_name}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    ID Transacción: <strong className="text-gray-700 font-mono text-xs">{selectedLog.id}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Fecha: <strong className="text-gray-700 text-xs">
                      {new Date(selectedLog.changed_at).toLocaleString('es-ES')}
                    </strong>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors self-end sm:self-auto"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {(selectedLog.action === 'UPDATE' || selectedLog.action === 'DELETE') && (
                  <JsonViewer data={selectedLog.old_data} title="Estado Anterior (old_data)" />
                )}
                {(selectedLog.action === 'UPDATE' || selectedLog.action === 'INSERT') && (
                  <JsonViewer data={selectedLog.new_data} title="Nuevo Estado (new_data)" />
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm transition-colors shadow-sm focus:ring-4 focus:ring-gray-200"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
