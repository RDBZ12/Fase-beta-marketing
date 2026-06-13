import React from 'react';
import { Edit2, MoreHorizontal, Search } from 'lucide-react';
import type { Campaign } from '../types';

interface CampaignsTableProps {
  campaigns: Campaign[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onModifyCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  searchTerm,
  setSearchTerm,
  onModifyCampaign,
  onDeleteCampaign,
}) => {
  const getChannelStyle = (channel: string) => {
    switch (channel) {
      case 'Email':
        return 'bg-violet-50 text-violet-600 border border-violet-100';
      case 'Social':
        return 'bg-pink-50 text-pink-600 border border-pink-100';
      case 'Display':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'Multi':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Activa':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Pausada':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Completada':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Activa':
        return 'bg-emerald-500';
      case 'Pausada':
        return 'bg-amber-500';
      case 'Completada':
        return 'bg-blue-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Campañas</h3>
          <p className="text-xs text-slate-400 font-medium">{campaigns.length} campañas activas y recientes</p>
        </div>
        
        {/* Table Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar campaña..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pt-1">Campaña</th>
              <th className="pb-3 pt-1">Canal</th>
              <th className="pb-3 pt-1">Estado</th>
              <th className="pb-3 pt-1 text-right">Leads</th>
              <th className="pb-3 pt-1 text-right">Alcance</th>
              <th className="pb-3 pt-1 text-right">CTR</th>
              <th className="pb-3 pt-1">Inicio</th>
              <th className="pb-3 pt-1 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                  No se encontraron campañas.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      {camp.image_url ? (
                        <img src={camp.image_url} alt={camp.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                          {camp.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800 block">{camp.name}</span>
                        {camp.brand && (
                          <span className="text-[10px] text-slate-400 font-medium block">Marca: {camp.brand}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getChannelStyle(camp.channel)}`}>
                      {camp.channel}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(camp.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(camp.status)}`}></span>
                      {camp.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono font-semibold text-slate-700">{camp.leads.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-mono font-semibold text-slate-700">{camp.reach}</td>
                  <td className="py-3.5 text-right font-mono font-semibold text-slate-700">{camp.ctr}%</td>
                  <td className="py-3.5 text-slate-500 font-semibold">{camp.startDate}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onModifyCampaign(camp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all duration-150"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Modificar</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar la campaña "${camp.name}"?`)) {
                            onDeleteCampaign(camp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-150"
                        title="Eliminar campaña"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
