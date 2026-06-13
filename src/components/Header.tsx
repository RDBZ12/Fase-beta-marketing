import React from 'react';
import { 
  LogOut, 
  X, 
  Search, 
  Printer, 
  Save, 
  Upload, 
  Plus, 
  Sparkles 
} from 'lucide-react';

interface HeaderProps {
  onNewCampaign: () => void;
  onOpenAIModal: () => void;
  onSearchClick: () => void;
  onPrintClick: () => void;
  onSaveClick: () => void;
  onPublishClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewCampaign,
  onOpenAIModal,
  onSearchClick,
  onPrintClick,
  onSaveClick,
  onPublishClick,
}) => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">Viernes, 8 de junio de 2026</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Action Buttons */}
        <button 
          onClick={onPublishClick} 
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5 rotate-180" />
          <span>Salir</span>
        </button>

        <button 
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all duration-200"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

        <button 
          onClick={onSearchClick}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Buscar</span>
        </button>

        <button 
          onClick={onPrintClick}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Imprimir</span>
        </button>

        <button 
          onClick={onSaveClick}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all duration-200"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>

        <button 
          onClick={onPublishClick}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all duration-200"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Publicar</span>
        </button>

        <button 
          onClick={onNewCampaign}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nuevo</span>
        </button>

        {/* Generar Contenido IA Button */}
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
