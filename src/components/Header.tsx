import React from 'react';
import { 
  Menu,
  Search, 
  Plus, 
  Sparkles 
} from 'lucide-react';

interface HeaderProps {
  onNewCampaign: () => void;
  onOpenAIModal: () => void;
  onSearchClick: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewCampaign,
  onOpenAIModal,
  onSearchClick,
  onToggleSidebar,
}) => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center p-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
          aria-label="Ocultar menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {/* <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Sabado, 13 de junio de 2026</p> */}
        </div>

        <button 
          onClick={onSearchClick}
          className="flex items-center gap-2 px-4 py-2 min-w-[140px] text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Buscar</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">


        <button 
          onClick={onNewCampaign}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-500 border border-emerald-600 hover:bg-emerald-600 hover:border-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo</span>
        </button>

        <button 
          onClick={onOpenAIModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-200 hover:shadow-violet-300 transform active:scale-95 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 fill-white/20 animate-pulse" />
          <span>Generar Contenido IA</span>
        </button>
      </div>
    </header>
  );
};
