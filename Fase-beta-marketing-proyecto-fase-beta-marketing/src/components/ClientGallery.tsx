import React, { useState } from 'react';
import { Search, Eye, Download, X, Layers, Share2, ArrowLeftRight } from 'lucide-react';
import type { Campaign } from '../types';

interface ClientGalleryProps {
  campaigns: Campaign[];
  onBackToDashboard?: () => void;
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({ campaigns, onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const filtered = campaigns.filter((camp) => {
    const matchesSearch =
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (camp.brand && camp.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesChannel = selectedChannel === 'All' || camp.channel === selectedChannel;
    const isMarketingReady = camp.status === 'Activa' || camp.status === 'Completada';

    return matchesSearch && matchesChannel && isMarketingReady;
  });

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (camp: Campaign) => {
    navigator.clipboard.writeText(
      `Campaña: ${camp.name} | Marca: ${camp.brand || 'N/A'} | Canal: ${camp.channel}`
    );
    alert('Información de campaña copiada al portapapeles.');
  };

  return (
    <div className={`space-y-6 ${isFullscreenMode ? 'p-8 bg-slate-900 min-h-screen text-white fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${isFullscreenMode ? 'text-white' : 'text-slate-900'}`}>
            Catálogo Publicitario
          </h2>
          <p className={`text-xs font-medium ${isFullscreenMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Explora las piezas gráficas y el rendimiento de las campañas de marketing de tabaco activas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFullscreenMode(!isFullscreenMode)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-150 shadow-sm ${
              isFullscreenMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isFullscreenMode ? 'Salir Pantalla Completa' : 'Modo Presentación'}</span>
          </button>

          {onBackToDashboard && !isFullscreenMode && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-200 transition-all duration-150"
            >
              Volver al Panel
            </button>
          )}
        </div>
      </div>

      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 justify-between items-center ${
        isFullscreenMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por marca o campaña..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 ${
              isFullscreenMode
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Email', 'Social', 'Display', 'Multi'].map((chan) => (
            <button
              key={chan}
              onClick={() => setSelectedChannel(chan)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 ${
                selectedChannel === chan
                  ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                  : isFullscreenMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {chan === 'All' ? 'Todos' : chan}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className={`text-sm font-semibold ${isFullscreenMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No hay campañas publicitarias de tabaco activas para mostrar.
            </p>
            <p className="text-xs text-slate-400 mt-1">Asegúrate de marcar el estado de las campañas como "Activa" o "Completada".</p>
          </div>
        ) : (
          filtered.map((camp) => (
            <div
              key={camp.id}
              className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full ${
                isFullscreenMode
                  ? 'bg-slate-800/80 border-slate-700 text-white'
                  : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="aspect-video relative overflow-hidden bg-slate-900/10 flex items-center justify-center">
                {camp.image_url ? (
                  <img
                    src={camp.image_url}
                    alt={camp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-slate-400 font-bold text-sm">
                    Anuncio Gráfico
                  </div>
                )}

                <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/60 backdrop-blur-sm text-[10px] font-bold text-white rounded-md tracking-wider uppercase">
                  {camp.channel}
                </span>

                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedCampaign(camp)}
                    className="p-2 bg-white rounded-full text-slate-800 hover:bg-slate-100 transition-colors shadow-lg"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {camp.image_url && (
                    <button
                      onClick={() => handleDownload(camp.image_url!, `${camp.name}.jpg`)}
                      className="p-2 bg-white rounded-full text-slate-800 hover:bg-slate-100 transition-colors shadow-lg"
                      title="Descargar imagen"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-1 ${
                    isFullscreenMode ? 'text-violet-400' : 'text-violet-600'
                  }`}>
                    {camp.brand || 'Marca no especificada'}
                  </span>
                  <h4 className="font-bold text-sm line-clamp-1">{camp.name}</h4>
                </div>

                <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl text-center text-xs font-semibold ${
                  isFullscreenMode ? 'bg-slate-900/50' : 'bg-slate-50'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">LEADS</span>
                    <span className={isFullscreenMode ? 'text-slate-200' : 'text-slate-700'}>
                      {camp.leads.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">CTR</span>
                    <span className="text-emerald-500">{camp.ctr}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">ALCANCE</span>
                    <span className={isFullscreenMode ? 'text-slate-200' : 'text-slate-700'}>{camp.reach}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => setSelectedCampaign(camp)}
                    className="flex-1 py-2 text-xs font-bold text-center border border-violet-100 rounded-xl hover:bg-violet-50/50 text-violet-600 transition-colors"
                  >
                    Ver Ampliado
                  </button>
                  <button
                    onClick={() => handleShare(camp)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition-colors"
                    title="Copiar datos"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-slate-900 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px]">
              {selectedCampaign.image_url ? (
                <img
                  src={selectedCampaign.image_url}
                  alt={selectedCampaign.name}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              ) : (
                <div className="text-slate-500 text-xs font-bold">Sin Imagen Publicitaria</div>
              )}
            </div>

            <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between bg-slate-900">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                    {selectedCampaign.brand}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1 leading-tight">{selectedCampaign.name}</h3>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Canal Publicitario</span>
                    <span className="font-bold px-2 py-0.5 bg-slate-800 rounded text-violet-50 uppercase">
                      {selectedCampaign.channel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Fecha de Lanzamiento</span>
                    <span className="font-bold text-slate-200">{selectedCampaign.startDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Estado de Campaña</span>
                    <span className="font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px]">
                      {selectedCampaign.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block">
                    Métricas de Impacto
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold block">LEADS</span>
                      <span className="text-xs font-extrabold text-white">
                        {selectedCampaign.leads.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold block">CTR</span>
                      <span className="text-xs font-extrabold text-emerald-400">{selectedCampaign.ctr}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold block">ALCANCE</span>
                      <span className="text-xs font-extrabold text-white">{selectedCampaign.reach}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-slate-800 mt-6 md:mt-0">
                {selectedCampaign.image_url && (
                  <button
                    onClick={() => handleDownload(selectedCampaign.image_url!, `${selectedCampaign.name}.jpg`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Arte</span>
                  </button>
                )}
                <button
                  onClick={() => handleShare(selectedCampaign)}
                  className="p-2.5 border border-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                  title="Copiar datos"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
