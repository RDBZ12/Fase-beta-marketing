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
import { PaymentModal } from './components/PaymentModal';
import { UsuariosModule } from './components/UsuariosModule';
import { ClientesModule } from './components/ClientesModule';
import { LeadsModule } from './components/LeadsModule';
import { PublicacionesModule } from './components/PublicacionesModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { PagosModule } from './components/PagosModule';
import { AjustesModule } from './components/AjustesModule';
import { ChatbotWidget } from './components/ChatbotWidget';
import { UserProvider } from './context/UserContext';
import type { Campaign, Metric } from './types';
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
    startDate:   item.start_date ?? '',
    descripcion: item.descripcion,
    objetivo:    item.objetivo,
    presupuesto: item.presupuesto,
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
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
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
            onSaveClick={() => alert('¡Datos guardados!')}
            onPublishClick={() => alert('¡Dashboard publicado!')}
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

        {activeTab === 'campanas' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm text-center">
            <h2 className="text-lg font-bold text-slate-800">Gestión de Campañas</h2>
            <p className="text-xs text-slate-400 mt-1">Las campañas se gestionan desde el Dashboard principal.</p>
            <button onClick={() => setActiveTab('dashboard')}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors">
              Ir al Dashboard
            </button>
          </div>
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

    if (data && !error) {
      setTipoUsuario('equipo');
      setRolUsuario(data.id_rol);
      setActiveTab('dashboard');
    } else {
      setTipoUsuario('cliente');
      setRolUsuario(null);
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
        setCampaigns(data.map(mapCampaign));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchInteractions();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchInteractions();
    }
  }, [activeTab]);

  if (loadingAuth || (session && tipoUsuario === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthButton />;

  if (tipoUsuario === 'cliente') {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientGallery campaigns={campaigns} onBackToDashboard={() => {}} />
      </div>
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
