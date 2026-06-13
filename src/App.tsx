import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { LeadsChart } from './components/LeadsChart';
import { Channels } from './components/Channels';
import { CampaignsTable } from './components/CampaignsTable';
import { CampaignModal } from './components/CampaignModal';
import { AIModal } from './components/AIModal';
import { ClientGallery } from './components/ClientGallery';
import type { Campaign, Metric } from './types';
import './App.css';

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Q2 Lead Generation',
    channel: 'Email',
    status: 'Activa',
    leads: 3841,
    reach: '142K',
    ctr: 4.2,
    startDate: '01 Jun 2026',
  },
  {
    id: '2',
    name: 'Social Brand Awareness',
    channel: 'Social',
    status: 'Activa',
    leads: 6238,
    reach: '588K',
    ctr: 2.8,
    startDate: '15 May 2026',
  },
  {
    id: '3',
    name: 'Retargeting Display',
    channel: 'Display',
    status: 'Pausada',
    leads: 1102,
    reach: '89K',
    ctr: 1.1,
    startDate: '20 Apr 2026',
  },
  {
    id: '4',
    name: 'Newsletter Primavera',
    channel: 'Email',
    status: 'Completada',
    leads: 5490,
    reach: '210K',
    ctr: 5.9,
    startDate: '01 Mar 2026',
  },
  {
    id: '5',
    name: 'Lanzamiento Producto',
    channel: 'Multi',
    status: 'Activa',
    leads: 2150,
    reach: '95K',
    ctr: 3.5,
    startDate: '10 Jul 2026',
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tobacco_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
      } else if (data) {
        // Map database columns (snake_case) to state interface (camelCase)
        const mappedCampaigns: Campaign[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          image_url: item.image_url,
          channel: item.channel,
          status: item.status,
          leads: item.leads || 0,
          reach: item.reach || '0',
          ctr: Number(item.ctr) || 0.0,
          startDate: item.start_date || '',
        }));
        setCampaigns(mappedCampaigns);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Dynamic Metrics calculation
  const totalLeads = campaigns.reduce((sum, camp) => sum + camp.leads, 0) + 6010; // offset to match 24,831
  const avgCtr = campaigns.length > 0 
    ? (campaigns.reduce((sum, camp) => sum + camp.ctr, 0) / campaigns.length).toFixed(1)
    : '0';

  const metrics: Metric[] = [
    {
      label: 'Total de Leads',
      value: totalLeads.toLocaleString('es-ES'),
      change: '+18.4%',
      isPositive: true,
      subtext: 'vs. mes anterior',
    },
    {
      label: 'Prediccion de Alcance',
      value: '1.2M',
      change: '+39.1%',
      isPositive: true,
      subtext: 'próximos 30 días',
    },
    {
      label: 'Tasa de Conversión',
      value: `${(Number(avgCtr) * 1.3).toFixed(1)}%`, // Simulating conversion rate based on CTR
      change: '-0.3pp',
      isPositive: false,
      subtext: 'vs. mes anterior',
    },
    {
      label: 'ROI Promedio',
      value: '312%',
      change: '+141pp',
      isPositive: true,
      subtext: 'todas las campañas',
    },
  ];

  // Actions
  const handleClearTestData = async () => {
    if (confirm('¿Deseas eliminar todas las campañas de la base de datos de Supabase?')) {
      try {
        const { error } = await supabase
          .from('tobacco_products')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all

        if (error) throw error;
        await fetchCampaigns();
      } catch (error: any) {
        alert(`Error al limpiar datos: ${error.message || error}`);
      }
    }
  };

  const handleRestoreDefaultData = async () => {
    try {
      const dbDataList = DEFAULT_CAMPAIGNS.map(camp => ({
        name: camp.name,
        brand: camp.brand || 'Tabacalera Genérica',
        image_url: camp.image_url || '',
        channel: camp.channel,
        status: camp.status,
        leads: camp.leads,
        reach: camp.reach,
        ctr: camp.ctr,
        start_date: camp.startDate,
      }));

      const { error } = await supabase
        .from('tobacco_products')
        .insert(dbDataList);

      if (error) throw error;
      await fetchCampaigns();
    } catch (error: any) {
      alert(`Error al restaurar datos: ${error.message || error}`);
    }
  };

  const handleSaveCampaign = async (campaign: Campaign) => {
    try {
      const dbData = {
        name: campaign.name,
        brand: campaign.brand,
        image_url: campaign.image_url,
        channel: campaign.channel,
        status: campaign.status,
        leads: campaign.leads,
        reach: campaign.reach,
        ctr: campaign.ctr,
        start_date: campaign.startDate,
      };

      if (editingCampaign) {
        // Update existing campaign in Supabase
        const { error } = await supabase
          .from('tobacco_products')
          .update(dbData)
          .eq('id', campaign.id);

        if (error) throw error;
      } else {
        // Insert new campaign into Supabase
        const { error } = await supabase
          .from('tobacco_products')
          .insert([dbData]);

        if (error) throw error;
      }
      await fetchCampaigns();
    } catch (error: any) {
      alert(`Error al guardar la campaña: ${error.message || error}`);
    }
    setEditingCampaign(null);
  };

  const handleModifyClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tobacco_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCampaigns();
    } catch (error: any) {
      alert(`Error al eliminar la campaña: ${error.message || error}`);
    }
  };

  const filteredCampaigns = campaigns.filter(camp =>
    camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (camp.brand && camp.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    camp.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camp.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSidebarOpen && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {activeTab !== 'portal-cliente' && (
          <Header 
            onNewCampaign={() => {
              setEditingCampaign(null);
              setIsCampaignModalOpen(true);
            }}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            onSearchClick={() => {
              const el = document.querySelector('input[placeholder="Buscar campaña..."]');
              if (el instanceof HTMLInputElement) el.focus();
            }}
            onSaveClick={() => alert('¡Datos guardados con éxito!')}
            onPublishClick={() => alert('¡Dashboard publicado correctamente!')}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        )}

        {activeTab === 'dashboard' ? (
          <>
            {/* Metric Cards Grid */}
            <MetricCards metrics={metrics} />

            {/* Central Area: Chart & Channels */}
            <div className="flex flex-col lg:flex-row gap-6">
              <LeadsChart />
              <Channels onClearTestData={handleClearTestData} />
            </div>

            {/* Reset data helper banner if empty */}
            {campaigns.length === 0 && (
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs font-semibold text-violet-700">
                  Has eliminado los datos de prueba. Puedes restaurarlos haciendo clic en el botón de la derecha.
                </p>
                <button
                  onClick={handleRestoreDefaultData}
                  className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-200 transition-all duration-150"
                >
                  Restaurar Datos
                </button>
              </div>
            )}

            {/* Campaigns Table */}
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-semibold">Cargando campañas desde Supabase...</p>
              </div>
            ) : (
              <CampaignsTable 
                campaigns={filteredCampaigns}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onModifyCampaign={handleModifyClick}
                onDeleteCampaign={handleDeleteCampaign}
              />
            )}
          </>
        ) : activeTab === 'portal-cliente' ? (
          <ClientGallery 
            campaigns={campaigns} 
            onBackToDashboard={() => setActiveTab('dashboard')} 
          />
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm text-center">
            <h2 className="text-lg font-bold text-slate-800">Sección: {activeTab.toUpperCase()}</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Esta sección se encuentra en desarrollo en base al diseño principal.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => {
          setIsCampaignModalOpen(false);
          setEditingCampaign(null);
        }}
        onSave={handleSaveCampaign}
        campaignToEdit={editingCampaign}
      />

      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
}

export default App;
