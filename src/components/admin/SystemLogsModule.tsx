import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Terminal, AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';

export const SystemLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Intentamos obtener datos de una tabla system_logs
      // Si la tabla no existe, mostraremos un error de forma controlada
      let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100);
      
      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error al obtener system_logs:', error.message);
      // Fallback con datos de ejemplo si la tabla no existe o hay error
      if (logs.length === 0) {
        setLogs([
          { id: 1, created_at: new Date().toISOString(), level: 'INFO', source: 'Auth', message: 'Módulo de Logs inicializado', metadata: {} },
          { id: 2, created_at: new Date(Date.now() - 10000).toISOString(), level: 'WARNING', source: 'WhatsApp API', message: 'Tasa de límite cercana', metadata: { limit: '80%' } },
          { id: 3, created_at: new Date(Date.now() - 30000).toISOString(), level: 'ERROR', source: 'Database', message: 'Tabla system_logs no encontrada (Demo mode)', metadata: { detail: 'Crear tabla para uso real' } }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterLevel]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-500 bg-red-50 border-red-200';
      case 'WARNING': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'INFO': return 'text-blue-500 bg-blue-50 border-blue-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Terminal className="w-7 h-7 text-slate-700" />
            Logs del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Monitoreo en tiempo real de eventos, errores y actividades internas del servidor.
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Refrescar'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en los logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2 transition-all font-medium outline-none"
            >
              <option value="all">Todos los Niveles</option>
              <option value="INFO">Información (INFO)</option>
              <option value="WARNING">Advertencias (WARNING)</option>
              <option value="ERROR">Errores (ERROR)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-0 bg-slate-900 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
              <AlertCircle className="w-12 h-12 text-slate-500" />
              <p className="text-sm font-bold text-slate-400">No hay logs registrados o encontrados.</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Fecha / Hora</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Nivel</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Origen</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">Mensaje / Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-ES', { 
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getLevelColor(log.level)}`}>
                        {log.level || 'INFO'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-emerald-400 whitespace-nowrap">
                      {log.source || 'Sistema'}
                    </td>
                    <td className="px-6 py-3 text-slate-300">
                      <span className="font-semibold text-white">{log.message}</span>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="mt-2 p-2 bg-black/30 rounded-lg text-[10px] text-slate-400 overflow-x-auto border border-slate-700/50">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
