import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthButton from './components/AuthButton';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { LeadsChart } from './components/LeadsChart';
import { Channels } from './components/Channels';
import { CampaignsTable } from './components/CampaignsTable';
import { CampaignModal } from './components/CampaignModal';
import { AIModal } from './components/AIModal';
import { ClientPortal } from './components/ClientPortal';
import { PaymentModal } from './components/PaymentModal';
import { UsuariosModule } from './components/UsuariosModule';

import { LeadsModule } from './components/LeadsModule';
import { PagosModule } from './components/PagosModule';
import { AjustesModule } from './components/AjustesModule';
import { CampanasModule } from './components/CampanasModule';
import { LearningProvider } from './learning/context/LearningContext';
import LearningTour from './learning/components/tour/LearningTour';
import LearningFAB from './learning/components/LearningFAB';
import LearningChat from './learning/components/LearningChat';
import { LearningDispatcher } from './learning/services/LearningDispatcher';
import { DataExplorerModule } from './components/data-explorer/DataExplorerModule';
import { CentroReportes } from './components/reportes/CentroReportes';
import { AdminCampanasModule } from './components/admin/AdminCampanasModule';
import { AdminDashboardModule } from './components/admin/AdminDashboardModule';
import { ClientesModule } from './components/admin/ClientesModule';
import AdminAuditLogs from './components/admin/AdminAuditLogs';

import { UserProvider } from './context/UserContext';
import type { Campaign, Metric } from './types';
import { ShieldCheck } from 'lucide-react';
import './App.css';

function mapCampaign(item: any): Campaign {
  return {
    id:          item.id,
    name:        item.nombre_campana ?? item.name ?? '',
    brand:       item.brand,
    image_url:   item.image_url,
    channel:     item.channel ?? 'Multi',
    status:      item.estado ?? 'Activa',
    leads:       item.leads ?? 0,
    reach:       item.reach ?? '0',
    ctr:         Number(item.ctr) || 0,
    startDate:   item.fecha_inicio ?? item.start_date ?? '',
    endDate:     item.fecha_fin ?? '',
    descripcion: item.descripcion,
    objetivo:    item.objetivo,
    presupuesto: item.presupuesto,
    id_cliente:  item.id_cliente,
    id_usuario:  item.id_usuario || item.usuario_id,
    creatorName: item.creatorName,
    creatorRole: item.creatorRole,
    estado_moderacion: item.estado_moderacion,
  };
}

const GlobalErrorPopup = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const handleOpenWAError = (e: any) => {
      setErrorMsg(e.detail);
      setIsHiding(false);
      
      setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          setErrorMsg(null);
          setIsHiding(false);
        }, 400); 
      }, 8000);
    };

    window.addEventListener('openwa-error', handleOpenWAError);
    return () => window.removeEventListener('openwa-error', handleOpenWAError);
  }, []);

  if (!errorMsg) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[90%] ${isHiding ? 'animate-slide-up-fade' : 'animate-bounce-down'}`}>
      <div className="bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4">
        <div className="bg-white/20 p-2 rounded-full shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">¡Atención!</h3>
          <p className="text-sm text-white/90 leading-relaxed">{errorMsg}</p>
        </div>
        <button 
          onClick={() => setIsHiding(true)}
          className="ml-auto text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
  );
};

interface AppLayoutProps {
  campaigns: Campaign[];
  fetchCampaigns: () => Promise<void>;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rolUsuario: number | null;
  onPagarCampaign: (campaign: Campaign) => void;
  totalInteractions: number;
}

function AppLayout({
  campaigns,
  fetchCampaigns,
  loading,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  rolUsuario,
  onPagarCampaign,
  totalInteractions,
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const totalLeads     = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const avgCtr         = campaigns.length > 0
    ? (campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length).toFixed(1) : '0';
  const activeCampaigns = campaigns.filter(c => c.status === 'Activa').length;

  const metrics: Metric[] = [
    { label: 'Total de Leads',      value: totalLeads.toLocaleString('es-ES'),                change: '+18.4%', isPositive: true,  subtext: 'desde campañas activas' },
    { label: 'Campañas Activas',    value: activeCampaigns.toString(),                         change: '+' + activeCampaigns, isPositive: activeCampaigns > 0, subtext: `de ${campaigns.length} totales` },
    { label: 'Tasa de Conversión',  value: `${(Number(avgCtr) * 1.3).toFixed(1)}%`,           change: '-0.3pp', isPositive: false, subtext: 'vs. mes anterior' },
    { label: 'Interacciones Redes',  value: totalInteractions.toLocaleString('es-ES'),          change: '+24.5%', isPositive: true,  subtext: 'en todas las publicaciones' },
  ];

  const handleSaveCampaign = async (campaign: Campaign) => {
    try {
      const dbData = {
        nombre_campana: campaign.name, brand: campaign.brand, image_url: campaign.image_url,
        channel: campaign.channel, estado: campaign.status, leads: campaign.leads,
        reach: campaign.reach, ctr: campaign.ctr, start_date: campaign.startDate,
        fecha_inicio: campaign.startDate,
        fecha_fin: campaign.endDate,
        descripcion: campaign.descripcion, objetivo: campaign.objetivo, presupuesto: campaign.presupuesto,
      };
      if (editingCampaign) {
        const { error } = await supabase.from('campaigns').update(dbData).eq('id', campaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('campaigns').insert([dbData]);
        if (error) throw error;
      }
      await fetchCampaigns();
    } catch (error: any) { alert(`Error: ${error.message}`); }
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      await fetchCampaigns();
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.brand && c.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.creatorName && c.creatorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <GlobalErrorPopup />
      {isSidebarOpen && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} rolUsuario={rolUsuario} />
      )}

      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {activeTab !== 'portal-cliente' && activeTab !== 'perfil' && (
          <Header
            onNewCampaign={() => { setEditingCampaign(null); setIsCampaignModalOpen(true); }}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            onSearchClick={() => {
              const el = document.querySelector('input[placeholder="Buscar campaña..."]');
              if (el instanceof HTMLInputElement) el.focus();
            }}
            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          />
        )}

        {activeTab === 'dashboard' && rolUsuario === 1 ? (
          <AdminDashboardModule />
        ) : activeTab === 'dashboard' && (
          <>
            <MetricCards metrics={metrics} />
            <div className="flex flex-col lg:flex-row gap-6">
              <LeadsChart />
              <Channels onClearTestData={async () => {
                if (!confirm('¿Eliminar todas las campañas?')) return;
                await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                fetchCampaigns();
              }} />
            </div>
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-semibold">Cargando campañas...</p>
              </div>
            ) : (
              <CampaignsTable
                campaigns={filteredCampaigns}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onModifyCampaign={(c) => { setEditingCampaign(c); setIsCampaignModalOpen(true); }}
                onDeleteCampaign={handleDeleteCampaign}
                onPagarCampaign={onPagarCampaign}
              />
            )}
          </>
        )}

        {activeTab === 'perfil'          && <AuthButton />}
        {activeTab === 'usuarios'        && <UsuariosModule />}
        {activeTab === 'clientes'        && <ClientesModule />}
        {activeTab === 'leads'           && <LeadsModule />}
        {activeTab === 'pagos'           && <PagosModule />}
        {activeTab === 'ajustes'         && <AjustesModule />}
        {activeTab === 'consultas'       && <DataExplorerModule />}
        {activeTab === 'reportes'        && <CentroReportes />}
        {activeTab === 'admin_campanas'  && <AdminCampanasModule campaigns={campaigns} fetchCampaigns={fetchCampaigns} />}
        {activeTab === 'auditoria'       && <AdminAuditLogs />}

        {activeTab === 'campanas' && (
          <CampanasModule
            campaigns={campaigns}
            onModifyCampaign={(c) => { setEditingCampaign(c); setIsCampaignModalOpen(true); }}
            onDeleteCampaign={handleDeleteCampaign}
            onPagarCampaign={onPagarCampaign}
          />
        )}
      </main>

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => { setIsCampaignModalOpen(false); setEditingCampaign(null); }}
        onSave={handleSaveCampaign}
        campaignToEdit={editingCampaign}
      />
      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      
    </div>
  );
}

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState<'cliente' | 'equipo' | null>(null);
  const [rolUsuario, setRolUsuario] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [paymentCampaign, setPaymentCampaign] = useState<Campaign | null>(null);
  const [validatingCampaign, setValidatingCampaign] = useState<Campaign | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [verificationData, setVerificationData] = useState<{
    ncf: string;
    total: string;
    fecha: string;
    receptor: string;
    rnc_receptor?: string;
    concepto?: string;
  } | null>(null);

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase.from('interacciones').select('cantidad');
      if (!error && data) {
        const sum = data.reduce((acc: number, cur: any) => acc + (cur.cantidad || 0), 0);
        setTotalInteractions(sum);
      }
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const detectarTipoUsuario = async (userId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_rol, nombre, apellido')
      .eq('id_usuario', userId)
      .single();

    if (data && !error && data.id_rol === 1) {
      setTipoUsuario('equipo');
      setRolUsuario(data.id_rol);
      setActiveTab('dashboard');
    } else {
      setTipoUsuario('cliente');
      setRolUsuario(data?.id_rol || null);
      setActiveTab('portal-cliente');
    }
  };

  useEffect(() => {
    let lastUserId: string | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
      if (session?.user) {
        lastUserId = session.user.id;
        detectarTipoUsuario(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        if (lastUserId !== session.user.id) {
          lastUserId = session.user.id;
          detectarTipoUsuario(session.user.id);
          
          // Registrar login
          try {
            await supabase.from('audit_logs').insert({
              table_name: 'autenticacion',
              action: 'LOGIN',
              user_id: session.user.id,
              new_data: { evento: 'Inicio de sesión', plataforma: 'Web App' }
            });
          } catch (e) { /* ignore */ }
        }
      } 
      else if (event === 'SIGNED_OUT') {
        if (lastUserId) {
          // Registrar logout
          try {
            await supabase.from('audit_logs').insert({
              table_name: 'autenticacion',
              action: 'LOGOUT',
              user_id: lastUserId,
              new_data: { evento: 'Cierre de sesión', plataforma: 'Web App' }
            });
          } catch (e) { /* ignore */ }
        }
        
        lastUserId = null;
        setTipoUsuario(null);
        setRolUsuario(null);
      } 
      else if (session?.user) {
        // TOKEN_REFRESH or other events
        lastUserId = session.user.id;
        detectarTipoUsuario(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      let combinedData: any[] = [];
      await supabase.auth.getSession();
      
      // Determine if user is admin based on internal role mapping logic (or just rely on RLS/limit)
      // To prevent massive egress for admins, we limit the global app state to 150 recent campaigns.
      // The AdminCampanasModule handles its own deep pagination.
      let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      
      // For general app state, limit to 200 to prevent crash/egress on large databases
      query = query.limit(200);

      const { data: campsData } = await query;
      
      if (campsData) combinedData = [...combinedData, ...campsData];

      const { data: legacyData } = await supabase
        .from('tobacco_products').select('*').order('created_at', { ascending: false });
      
      if (legacyData) combinedData = [...combinedData, ...legacyData];

      if (combinedData.length > 0) {
        // 1. Obtener todos los IDs de creadores
        const creatorIds = [...new Set(combinedData.map(c => c.id_usuario || c.id_cliente).filter(Boolean))];
        
        let usersMap: Record<string, { name: string, role: string }> = {};

        if (creatorIds.length > 0) {
          // 2. Buscar en usuarios internos
          const { data: teamData } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, apellido, id_rol')
            .in('id_usuario', creatorIds);

          // 3. Buscar en clientes del portal
          const { data: clientsData } = await supabase
            .from('clientes_portal')
            .select('auth_user_id, nombre, apellido')
            .in('auth_user_id', creatorIds);

          // Roles estáticos para el mapeo
          const roles: Record<number, string> = {
            1: 'Administrador',
            2: 'Gerencia',
            3: 'Marketing',
            4: 'Community Manager',
            5: 'Servicio al Cliente'
          };

          if (teamData) {
            teamData.forEach((u: any) => {
              usersMap[u.id_usuario] = {
                name: `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Usuario Desconocido',
                role: roles[u.id_rol] || 'Equipo'
              };
            });
          }

          if (clientsData) {
            clientsData.forEach((c: any) => {
              usersMap[c.auth_user_id] = {
                name: `${c.nombre || ''} ${c.apellido || ''}`.trim() || 'Cliente Sin Nombre',
                role: 'Cliente'
              };
            });
          }
        }

        // 4. Mapear campañas y adjuntar los nombres/roles
        const mappedCampaigns = combinedData.map(c => {
          const creatorId = c.id_usuario || c.id_cliente;
          const creatorInfo = creatorId && usersMap[creatorId] ? usersMap[creatorId] : { name: 'Desconocido', role: 'N/A' };
          
          return mapCampaign({
            ...c,
            creatorName: creatorInfo.name,
            creatorRole: creatorInfo.role
          });
        });

        setCampaigns(mappedCampaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleInitiatePayment = async (campaign: Campaign) => {
    setValidatingCampaign(campaign);
    setValidationErrors(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const res = await fetch(`${supabaseUrl}/functions/v1/validate_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token ?? supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ campana_id: campaign.id }),
      });

      const data = await res.json();

      if (data.ok && data.valido) {
        setValidatingCampaign(null);
        setPaymentCampaign(campaign);
      } else {
        setValidationErrors(data.detalles || { "Error": [data.error || "Contenido rechazado."] });
      }
    } catch (err: any) {
      setValidationErrors({ "Error": [err.message || "Error de conexión con el validador."] });
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchInteractions();

    const subscription = supabase
      .channel('campaigns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns'
        },
        () => {
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ncf = params.get('verificar_ncf');
    if (ncf) {
      setVerificationData({
        ncf,
        total: params.get('total') || '0.00',
        fecha: params.get('fecha') || '',
        receptor: params.get('receptor') || 'Consumidor Final',
        rnc_receptor: params.get('rnc_receptor') || '',
        concepto: params.get('concepto') || ''
      });
    }
  }, []);

  const renderValidationModal = () => {
    if (!validatingCampaign && !validationErrors) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden p-6">
          {!validationErrors ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-slate-800">Validando contenido...</h3>
              <p className="text-sm text-slate-500 text-center">Revisando especificaciones técnicas y políticas de IA antes del pago.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Contenido Rechazado</h3>
              <p className="text-sm text-slate-500 text-center mb-2">No puedes pagar esta campaña porque el contenido no cumple con nuestras políticas o especificaciones técnicas.</p>
              
              <div className="w-full bg-rose-50 border border-rose-100 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-rose-700">
                {Object.entries(validationErrors).map(([pubId, errs]) => (
                  <div key={pubId} className="mb-2 last:mb-0">
                    <p className="font-bold text-xs uppercase tracking-wider mb-1">Errores encontrados:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {errs.map((e, idx) => (
                        <li key={idx} className="font-medium text-xs leading-relaxed">{e}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setValidatingCampaign(null); setValidationErrors(null); }}
                className="mt-4 w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (verificationData) {
    const totalVal = Number(verificationData.total) || 0;
    const netVal = totalVal / 1.18;
    const itbisVal = totalVal - netVal;

    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white font-sans">
        <div className="w-full max-w-lg bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
          
          {/* Logo y Encabezado de Impuestos Internos */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              {/* Escudo del Emisor */}
              <div className="flex items-center justify-center">
                <svg className="w-12 h-12 text-[#0f2d59]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C11.5 2 2 4 2 8c0 5.25 3.8 11.2 10 13 6.2-1.8 10-7.75 10-13 0-4-9.5-6-10-6zm0 16.5c-3.8-1.5-7-6.25-7-10.5 0-1.5 1-2.5 3-3 1.5.5 3 1.5 4 2.5 1-1 2.5-2 4-2.5 2 .5 3 1.5 3 3 0 4.25-3.2 9-7 10.5z" />
                </svg>
              </div>
              <div className="w-[1.5px] h-10 bg-red-600 self-center mx-1" />
              {/* Sol y Texto "IMPUESTOS INTERNOS" */}
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#8ec63f] animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="10" />
                    <circle cx="50" cy="20" r="6" />
                    <circle cx="50" cy="80" r="6" />
                    <circle cx="20" cy="50" r="6" />
                    <circle cx="80" cy="50" r="6" />
                    <circle cx="29" cy="29" r="6" />
                    <circle cx="71" cy="71" r="6" />
                    <circle cx="29" cy="71" r="6" />
                    <circle cx="71" cy="29" r="6" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-[#58595b] leading-tight tracking-wider">IMPUESTOS</span>
                  <span className="text-[12px] font-black text-[#58595b] leading-tight tracking-wider">INTERNOS</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">GOBIERNO DIGITAL</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verificación e-NCF</h1>
          </div>

          {/* Tabla de Verificación de Datos */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-600 w-1/3">RNC Emisor</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">1-31-00000-0</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Razón Social Emisor</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">MARKETDEV S.A.S.</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-600">e-NCF</td>
                  <td className="px-4 py-3.5 text-amber-600 font-mono font-bold text-lg tracking-wider">{verificationData.ncf}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Estado DGII</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">Aceptado</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Razón Social Receptor</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">{verificationData.receptor}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-slate-600">RNC Receptor</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">{verificationData.rnc_receptor || '—'}</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Detalle de Compra</td>
                  <td className="px-4 py-3.5 text-blue-600 font-extrabold bg-blue-50/30">
                    {verificationData.concepto || 'Servicio de Marketing Digital'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Fecha de Emisión</td>
                  <td className="px-4 py-3.5 text-slate-800 font-medium">{verificationData.fecha}</td>
                </tr>
                 <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Monto Gravado</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">
                    USD $ {netVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-slate-600">ITBIS Facturado (18%)</td>
                  <td className="px-4 py-3.5 text-slate-800 font-semibold">
                    USD $ {itbisVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-3.5 font-bold text-slate-600">Total Facturado</td>
                  <td className="px-4 py-3.5 text-emerald-600 font-black text-base">
                    USD $ {totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sello de Certificación Digital */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              Comprobante Fiscal Electrónico (e-CF) verificado exitosamente. Esta transacción está firmada digitalmente y registrada bajo los estándares fiscales del sandbox de la DGII de la República Dominicana para **UTESA**.
            </div>
          </div>

          {/* Pie de página */}
          <div className="pt-2">
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
              Marketdev · UTESA Proyecto Integrador
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <LearningProvider>
      {(() => {
        if (loadingAuth || (session && tipoUsuario === null)) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          );
        }

        if (!session) {
          return (
            <>
              <AuthButton />
              <LearningTour />
            </>
          );
        }

        if (tipoUsuario === 'cliente') {
          const clientCampaigns = campaigns.filter(c => c.id_cliente === session.user.id || c.id_usuario === session.user.id);
          return (
            <>
              <UserProvider userId={session.user.id}>
                <ClientPortal 
                  campaigns={clientCampaigns} 
                  onPagarCampaign={handleInitiatePayment} 
                  refreshCampaigns={fetchCampaigns} 
                />
              </UserProvider>
              <PaymentModal
                isOpen={!!paymentCampaign}
                onClose={() => {
                  setPaymentCampaign(null);
                  LearningDispatcher.dispatch('UPDATE_UI_STATE', { currentModal: null });
                }}
                campaign={paymentCampaign}
                session={session}
                onPagado={fetchCampaigns}
              />
              {renderValidationModal()}
              <LearningTour />
              <LearningFAB />
              <LearningChat />
            </>
          );
        }

        return (
          <>
            <UserProvider userId={session.user.id}>
              <AppLayout
                campaigns={campaigns}
                fetchCampaigns={fetchCampaigns}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                rolUsuario={rolUsuario}
                onPagarCampaign={handleInitiatePayment}
                totalInteractions={totalInteractions}
              />
            </UserProvider>
            <PaymentModal
              isOpen={!!paymentCampaign}
              onClose={() => {
                setPaymentCampaign(null);
                LearningDispatcher.dispatch('UPDATE_UI_STATE', { currentModal: null });
              }}
              campaign={paymentCampaign}
              session={session}
              onPagado={fetchCampaigns}
            />
            {renderValidationModal()}
          </>
        );
      })()}
    </LearningProvider>
  );
}
