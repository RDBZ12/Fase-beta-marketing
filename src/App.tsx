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
import { ClientGallery } from './components/ClientGallery';
import { ClientPortal } from './components/ClientPortal';
import { PaymentModal } from './components/PaymentModal';
import { UsuariosModule } from './components/UsuariosModule';
import { ClientesModule } from './components/ClientesModule';
import { LeadsModule } from './components/LeadsModule';
import { PublicacionesModule } from './components/PublicacionesModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { PagosModule } from './components/PagosModule';
import { AjustesModule } from './components/AjustesModule';
import { CampanasModule } from './components/CampanasModule';
import { ChatbotWidget } from './components/ChatbotWidget';
import { ConsultasModule } from './components/ConsultasModule';
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
    idCliente:   item.id_usuario || item.usuario_id || item.id_cliente,
    creatorName: item.creatorName,
    creatorRole: item.creatorRole,
  };
}

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

        {activeTab === 'dashboard' && (
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

        {activeTab === 'portal-cliente' && (
          <ClientGallery campaigns={campaigns} onBackToDashboard={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'perfil'          && <AuthButton />}
        {activeTab === 'usuarios'        && <UsuariosModule />}
        {activeTab === 'clientes'        && <ClientesModule />}
        {activeTab === 'audiencia'       && <LeadsModule />}
        {activeTab === 'publicaciones'   && <PublicacionesModule />}
        {activeTab === 'analytics'       && <AnalyticsModule />}
        {activeTab === 'pagos'           && <PagosModule />}
        {activeTab === 'ajustes'         && <AjustesModule />}
        {activeTab === 'consultas'       && <ConsultasModule />}

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
      <ChatbotWidget />
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
      if (session?.user) {
        detectarTipoUsuario(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        detectarTipoUsuario(session.user.id);
      } else {
        setTipoUsuario(null);
        setRolUsuario(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) {
        const { data: legacy } = await supabase.from('tobacco_products').select('*').order('created_at', { ascending: false });
        if (legacy) setCampaigns(legacy.map(mapCampaign));
      } else if (data) {
        // 1. Obtener todos los IDs de creadores
        const creatorIds = [...new Set(data.map(c => c.id_usuario || c.id_cliente).filter(Boolean))];
        
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
        const mappedCampaigns = data.map(c => {
          const creatorId = c.id_usuario || c.id_cliente;
          const creatorInfo = creatorId && usersMap[creatorId] ? usersMap[creatorId] : { name: 'Desconocido', role: 'N/A' };
          
          return mapCampaign({
            ...c,
            creatorName: creatorInfo.name,
            creatorRole: creatorInfo.role
          });
        });

        setCampaigns(mappedCampaigns);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchInteractions();
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

  if (loadingAuth || (session && tipoUsuario === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthButton />;

  if (tipoUsuario === 'cliente') {
    const clientCampaigns = campaigns.filter(c => c.idCliente === session.user.id);
    return (
      <>
        <UserProvider userId={session.user.id}>
          <ClientPortal campaigns={clientCampaigns} onPagarCampaign={(c) => setPaymentCampaign(c)} refreshCampaigns={fetchCampaigns} />
        </UserProvider>
        <PaymentModal
          isOpen={!!paymentCampaign}
          onClose={() => setPaymentCampaign(null)}
          campaign={paymentCampaign}
          session={session}
          onPagado={fetchCampaigns}
        />
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
          onPagarCampaign={(c) => setPaymentCampaign(c)}
          totalInteractions={totalInteractions}
        />
      </UserProvider>
      <PaymentModal
        isOpen={!!paymentCampaign}
        onClose={() => setPaymentCampaign(null)}
        campaign={paymentCampaign}
        session={session}
        onPagado={fetchCampaigns}
      />
    </>
  );
}
