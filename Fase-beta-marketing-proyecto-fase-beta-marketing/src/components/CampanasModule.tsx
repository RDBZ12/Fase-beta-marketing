import React, { useState } from 'react';
import { Clock, PlayCircle, Eye } from 'lucide-react';
import type { Campaign } from '../types';
import { CampaignsTable } from './CampaignsTable';

interface CampanasModuleProps {
  campaigns: Campaign[];
  onModifyCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onPagarCampaign: (campaign: Campaign) => void;
}

export const CampanasModule: React.FC<CampanasModuleProps> = ({
  campaigns,
  onModifyCampaign,
  onDeleteCampaign,
  onPagarCampaign,
}) => {
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'activas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.creatorName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filter === 'pendientes') {
      return c.status === 'Pendiente de Pago' || c.status === 'Borrador';
    }
    if (filter === 'activas') {
      return c.status === 'Activa';
    }
    return true; // 'todas'
  });

  const pendingCount = campaigns.filter(c => c.status === 'Pendiente de Pago' || c.status === 'Borrador').length;
  const activeCount = campaigns.filter(c => c.status === 'Activa').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Campañas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Revisa, aprueba y gestiona todas las campañas, incluyendo las autogeneradas por clientes.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === 'todas' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Todas ({campaigns.length})
          </button>
          <button 
            onClick={() => setFilter('pendientes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === 'pendientes' ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendientes ({pendingCount})
          </button>
          <button 
            onClick={() => setFilter('activas')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === 'activas' ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Activas ({activeCount})
          </button>
        </div>
      </div>

      {filter === 'pendientes' && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
             <Eye className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800">Campañas requieren tu atención</h3>
            <p className="text-sm text-amber-700 mt-1">
              Hay campañas generadas por la IA desde el Portal del Cliente esperando ser revisadas y pagadas para su lanzamiento automático.
            </p>
          </div>
        </div>
      )}

      {/* Reuse CampaignsTable for displaying the filtered list */}
      <CampaignsTable
        campaigns={filteredCampaigns}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onModifyCampaign={onModifyCampaign}
        onDeleteCampaign={onDeleteCampaign}
        onPagarCampaign={onPagarCampaign}
      />
    </div>
  );
};
