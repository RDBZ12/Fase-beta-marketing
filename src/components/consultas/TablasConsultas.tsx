import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Loader2, DatabaseBackup } from 'lucide-react';

// ─── COMPONENTE ENVOLTORIO GENÉRICO PARA TABLAS ────────────────────────────────

interface TablaWrapperProps {
  titulo: string;
  loading: boolean;
  error?: string | null;
  data: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  columnas: string[];
  renderFila: (item: any, index: number) => React.ReactNode;
}

const TablaWrapper: React.FC<TablaWrapperProps> = ({ 
  titulo, loading, error, data, searchTerm, setSearchTerm, columnas, renderFila 
}) => {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 relative z-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">{titulo}</h2>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en esta tabla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold tracking-wider uppercase border-b border-slate-100">
              <tr>
                {columnas.map((col, idx) => (
                  <th key={idx} className="px-6 py-4">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {error ? (
                <tr>
                  <td colSpan={columnas.length} className="px-6 py-16 text-center">
                    <p className="text-red-500 font-medium text-sm">Error Supabase: {error}</p>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={columnas.length} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Sincronizando con Supabase...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} className="px-6 py-16 text-center">
                    <DatabaseBackup className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-500 font-medium">No se encontraron registros para tu búsqueda.</p>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => renderFila(item, index))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── 1. TABLA CLIENTES ────────────────────────────────────────────────────────

export const TablaClientes: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (error) {
        console.error("Supabase error (usuarios):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => {
    const fullName = `${item.nombre || ''} ${item.apellido || ''}`.trim();
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (item.correo || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <TablaWrapper
      titulo="Directorio de Clientes"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Usuario', 'Teléfono', 'Correo', 'Estado']}
      renderFila={(item, idx) => (
        <tr key={item.id_usuario || idx} className="hover:bg-slate-50 transition-colors group cursor-pointer">
          <td className="px-6 py-4 font-bold text-slate-800">
            {item.nombre} {item.apellido}
          </td>
          <td className="px-6 py-4 font-medium text-slate-600">{item.telefono || 'N/A'}</td>
          <td className="px-6 py-4 text-slate-500">{item.correo || 'N/A'}</td>
          <td className="px-6 py-4">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {item.estado}
            </span>
          </td>
        </tr>
      )}
    />
  );
};

// ─── 2. TABLA CAMPAÑAS ────────────────────────────────────────────────────────

export const TablaCampaigns: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (campaigns):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.nombre_campana || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.estado || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TablaWrapper
      titulo="Desempeño de Campañas"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Campaña', 'Canal', 'Leads', 'Estado']}
      renderFila={(item) => (
        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 font-bold text-slate-800">{item.nombre_campana}</td>
          <td className="px-6 py-4 text-slate-500">{item.channel || 'Multi'}</td>
          <td className="px-6 py-4 font-medium text-slate-600">{item.leads}</td>
          <td className="px-6 py-4">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              item.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' :
              item.estado === 'Pausada' ? 'bg-amber-100 text-amber-700' :
              item.estado === 'Completada' ? 'bg-slate-100 text-slate-600' :
              'bg-blue-100 text-blue-700'
            }`}>
              {item.estado}
            </span>
          </td>
        </tr>
      )}
    />
  );
};

// ─── 3. TABLA LEADS ────────────────────────────────────────────────────────

export const TablaLeads: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('leads').select('*').order('fecha_registro', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (leads):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.correo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.interes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TablaWrapper
      titulo="Registro de Leads"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Nombre', 'Correo', 'Interés', 'Estado']}
      renderFila={(item) => (
        <tr key={item.id_lead} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 font-medium text-slate-800">{item.nombre}</td>
          <td className="px-6 py-4 text-slate-500">{item.correo || 'N/A'}</td>
          <td className="px-6 py-4 text-xs truncate max-w-[150px] text-slate-600">{item.interes || 'N/A'}</td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {item.estado}
            </span>
          </td>
        </tr>
      )}
    />
  );
};

// ─── 4. TABLA CONTENIDO IA ────────────────────────────────────────────────────────

export const TablaIA: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('contenido_ia').select('*').order('fecha', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (ia):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.tema || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.respuesta_ia || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TablaWrapper
      titulo="Generaciones de IA"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Contenido Generado', 'Canal', 'Tema', 'Fecha']}
      renderFila={(item) => (
        <tr key={item.id_contenido} className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-md truncate">{item.respuesta_ia}</td>
          <td className="px-6 py-4 font-bold text-slate-800">{item.canal || 'N/A'}</td>
          <td className="px-6 py-4 text-slate-500">{item.tema || 'N/A'}</td>
          <td className="px-6 py-4 text-slate-500">{new Date(item.fecha).toLocaleDateString()}</td>
        </tr>
      )}
    />
  );
};

// ─── 5. TABLA SENTIMIENTOS ────────────────────────────────────────────────────────

export const TablaSentimientos: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('analisis_sentimientos').select('*').order('fecha', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (sentimientos):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.comentario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sentimiento || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colors: Record<string, string> = {
    positivo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    negativo: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    neutro: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <TablaWrapper
      titulo="Análisis de Sentimientos"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Fecha', 'Comentario', 'Confianza', 'Sentimiento']}
      renderFila={(item) => (
        <tr key={item.id_analisis} className="hover:bg-slate-800/30 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">{new Date(item.fecha).toLocaleDateString()}</td>
          <td className="px-6 py-4 text-sm text-slate-300 truncate max-w-sm">"{item.comentario}"</td>
          <td className="px-6 py-4 font-mono text-xs">{(item.confianza * 100).toFixed(1)}%</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${colors[item.sentimiento?.toLowerCase()] || colors.neutro}`}>
              {item.sentimiento}
            </span>
          </td>
        </tr>
      )}
    />
  );
};

// ─── 6. TABLA INTERACCIONES ────────────────────────────────────────────────────────

export const TablaInteracciones: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('interacciones').select('*').order('fecha', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (interacciones):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.tipo_interaccion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TablaWrapper
      titulo="Métricas de Interacción"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Fecha', 'Tipo de Acción', 'Cantidad Generada']}
      renderFila={(item) => (
        <tr key={item.id_interaccion} className="hover:bg-slate-800/30 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">{new Date(item.fecha).toLocaleDateString()}</td>
          <td className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-amber-400">{item.tipo_interaccion}</td>
          <td className="px-6 py-4 font-mono font-bold text-white text-lg">+{item.cantidad}</td>
        </tr>
      )}
    />
  );
};

// ─── 7. TABLA PUBLICACIONES ────────────────────────────────────────────────────────

export const TablaPublicaciones: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('publicaciones').select('*').order('fecha_publicacion', { ascending: false }).limit(100);
      if (error) {
        console.error("Supabase error (publicaciones):", error);
        setErrorMsg(error.message);
      } else if (data) {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = data.filter(item => 
    (item.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.estado || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TablaWrapper
      titulo="Registro de Publicaciones"
      loading={loading}
      error={errorMsg}
      data={filtered}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      columnas={['Fecha Pub.', 'Título', 'Estado']}
      renderFila={(item) => (
        <tr key={item.id_publicacion} className="hover:bg-slate-800/30 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap">{new Date(item.fecha_publicacion).toLocaleDateString()}</td>
          <td className="px-6 py-4 font-medium text-white truncate max-w-sm">{item.titulo}</td>
          <td className="px-6 py-4">
             <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 uppercase tracking-widest border border-cyan-500/20">
              {item.estado}
            </span>
          </td>
        </tr>
      )}
    />
  );
};
