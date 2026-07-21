import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Building2, Search, Filter, MoreVertical, CreditCard, 
  Activity, Users, Zap, AlertTriangle, Play, Pause, ExternalLink,
  ChevronRight, LogIn, X, Clock, Settings
} from 'lucide-react';

export function ClientesModule() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    // En la base de datos asumimos la existencia de clientes_portal y sus relaciones
    // Haremos un fetch básico. En la práctica, puede que algunas de estas columnas sean mockeadas si no existen.
    const { data, error } = await supabase
      .from('clientes_portal')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Simularemos datos de suscripción para fines de demostración si no existen en la BD
      const mapped = data.map(c => ({
        ...c,
        rnc: c.rnc || 'N/A',
        empresa_nombre: c.empresa_nombre || `${c.nombre} ${c.apellido}`,
        plan: c.plan || (Math.random() > 0.5 ? 'Pro' : 'Básico'),
        fecha_renovacion: c.fecha_renovacion || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        estado: c.estado || 'activo',
        // Métricas simuladas para el detalle
        api_calls: Math.floor(Math.random() * 5000),
        wa_messages: Math.floor(Math.random() * 2000),
        campanas_activas: Math.floor(Math.random() * 5),
        limite_campanas: 5,
        balance_pendiente: Math.random() > 0.8 ? Math.floor(Math.random() * 500) : 0,
      }));
      setClientes(mapped);
    }
    setLoading(false);
  };

  const filteredClientes = clientes.filter(c => 
    c.empresa_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.rnc?.includes(searchTerm)
  );

  const handleAction = (action: string, cliente: any) => {
    if (action === 'impersonate') {
      alert(`Simulando inicio de sesión como: ${cliente.empresa_nombre}...`);
    } else if (action === 'suspend') {
      if(confirm(`¿Estás seguro de suspender la cuenta de ${cliente.empresa_nombre}?`)) {
        alert("Cuenta suspendida. (Simulación de actualización de base de datos)");
      }
    } else if (action === 'upgrade') {
      alert(`Abriendo modal para actualizar plan de ${cliente.empresa_nombre}...`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ─── ENCABEZADO ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h2>
          <p className="text-slate-500 font-medium">Gestión de cuentas externas, suscripciones y consumo.</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ─── TABLA PRINCIPAL (Master) ─── */}
        <div className={`transition-all duration-300 ${selectedCliente ? 'hidden lg:block lg:w-1/3' : 'w-full'}`}>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Buscar empresa o RNC..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredClientes.map(c => (
                    <li 
                      key={c.id_cliente} 
                      onClick={() => setSelectedCliente(c)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedCliente?.id_cliente === c.id_cliente ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-white transition-colors">
                          <Building2 className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{c.empresa_nombre}</h4>
                          <p className="text-[11px] text-slate-500 truncate">RNC: {c.rnc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider mb-1 ${c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {c.estado}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold">{c.plan}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedCliente?.id_cliente === c.id_cliente ? 'translate-x-1 text-blue-500' : 'group-hover:translate-x-1'}`} />
                      </div>
                    </li>
                  ))}
                  {filteredClientes.length === 0 && (
                    <li className="p-8 text-center text-slate-500 text-sm">No se encontraron clientes.</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ─── PANEL DE DETALLE (Detail) ─── */}
        {selectedCliente && (
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] animate-in slide-in-from-right-8 duration-300">
            {/* Cabecera Detalle */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <button onClick={() => setSelectedCliente(null)} className="lg:hidden p-2 -ml-2 bg-white rounded-lg border border-slate-200">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedCliente.empresa_nombre}</h3>
                  <div className="flex gap-2 items-center mt-1 text-xs font-medium text-slate-500">
                    <span>{selectedCliente.nombre} {selectedCliente.apellido}</span>
                    <span>•</span>
                    <a href={`mailto:${selectedCliente.correo}`} className="hover:text-blue-600">{selectedCliente.correo}</a>
                    <span>•</span>
                    <span>{selectedCliente.telefono}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleAction('impersonate', selectedCliente)} className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                  <LogIn className="w-3.5 h-3.5" /> Entrar como Cliente
                </button>
                <button onClick={() => setSelectedCliente(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl hidden lg:block">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Bloque A: Consumo y Límites */}
              <section>
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" /> Resumen de Consumo (Mes Actual)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peticiones IA (Gemini)</p>
                    <p className="text-2xl font-black text-slate-700">{selectedCliente.api_calls.toLocaleString()}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                      <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (selectedCliente.api_calls/10000)*100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volumen WhatsApp</p>
                    <p className="text-2xl font-black text-slate-700">{selectedCliente.wa_messages.toLocaleString()}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (selectedCliente.wa_messages/5000)*100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campañas Activas</p>
                    <p className="text-2xl font-black text-slate-700">{selectedCliente.campanas_activas} <span className="text-sm text-slate-400 font-medium">/ {selectedCliente.limite_campanas}</span></p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                      <div className={`h-1.5 rounded-full ${selectedCliente.campanas_activas >= selectedCliente.limite_campanas ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${(selectedCliente.campanas_activas/selectedCliente.limite_campanas)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bloque B: Estado Financiero */}
              <section>
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Estado Financiero & Suscripción
                </h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Actual</p>
                        <p className="text-lg font-black text-slate-800">{selectedCliente.plan}</p>
                      </div>
                      <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-2 py-1 rounded-md">Renovación: {new Date(selectedCliente.fecha_renovacion).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => handleAction('upgrade', selectedCliente)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                      Actualizar Plan (Up-sell)
                    </button>
                  </div>
                  <div className={`flex-1 border rounded-2xl p-5 shadow-sm ${selectedCliente.balance_pendiente > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Balance Pendiente</p>
                    <p className={`text-2xl font-black ${selectedCliente.balance_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${selectedCliente.balance_pendiente.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      {selectedCliente.balance_pendiente > 0 ? 'Existen facturas atrasadas que requieren atención.' : 'Cuenta al día. Sin facturas atrasadas.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Bloque C: Acciones de Riesgo & Entorno */}
              <section>
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" /> Configuración de Entorno
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm">
                    <Zap className="w-4 h-4" /> Forzar Desconexión WA
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm">
                    <ExternalLink className="w-4 h-4" /> Resetear Credenciales
                  </button>
                </div>
              </section>

              {/* Bloque D: Peligro */}
              <section className="pt-4 border-t border-slate-100">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Suspender Servicio</h4>
                    <p className="text-xs text-rose-600/80 mt-1 font-medium">Bloquea el acceso al portal y pausa todas las campañas activas inmediatamente.</p>
                  </div>
                  <button onClick={() => handleAction('suspend', selectedCliente)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm shadow-rose-200">
                    <Pause className="w-4 h-4" /> Suspender
                  </button>
                </div>
              </section>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
