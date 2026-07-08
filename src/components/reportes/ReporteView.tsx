import React from 'react';
import { ArrowLeft, Download, FileText, Filter, Search } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

interface ReporteViewProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onBack: () => void;
  children: React.ReactNode;
  filters?: React.ReactNode;
  exportDataFetcher?: () => Promise<any[]>;
  exportColumns?: { header: string; dataKey: string }[];
  exportFilename?: string;
  onSearchChange?: (term: string) => void;
  onDateChange?: (dates: { start: string, end: string }) => void;
}

export const ReporteView: React.FC<ReporteViewProps> = ({
  title,
  description,
  icon: Icon,
  onBack,
  children,
  filters,
  exportDataFetcher,
  exportColumns,
  exportFilename,
  onSearchChange,
  onDateChange
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleExportPDF = async () => {
    if (!exportDataFetcher || !exportColumns) return;
    setIsExporting(true);
    try {
      const data = await exportDataFetcher();
      await exportToPDF({
        title,
        filename: exportFilename || 'reporte',
        columns: exportColumns,
        data: data
      });
    } catch (e) {
      console.error("Export error", e);
    }
    setIsExporting(false);
  };

  const handleExportExcel = async () => {
    if (!exportDataFetcher || !exportColumns) return;
    setIsExporting(true);
    try {
      const data = await exportDataFetcher();
      await exportToExcel({
        title,
        filename: exportFilename || 'reporte',
        columns: exportColumns,
        data: data
      });
    } catch (e) {
      console.error("Export error", e);
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center justify-center p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Volver a Reportes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className={`w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100`}>
            <Icon className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleExportPDF}
            disabled={!exportDataFetcher || isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!exportDataFetcher || isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generando...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* Filtros Bar */}
      {(filters || onSearchChange) && (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {onSearchChange && (
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar en el reporte..."
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {onDateChange && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { 
                  setStartDate(e.target.value); 
                  onDateChange({ start: e.target.value, end: endDate }); 
                }}
                className="text-sm bg-transparent outline-none text-slate-600 px-2 py-1 cursor-pointer"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { 
                  setEndDate(e.target.value); 
                  onDateChange({ start: startDate, end: e.target.value }); 
                }}
                className="text-sm bg-transparent outline-none text-slate-600 px-2 py-1 cursor-pointer"
              />
            </div>
          )}
          
          {filters && (
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-2 text-slate-500 px-2 border-l border-slate-200">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Filtros:</span>
              </div>
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Contenido (Tabla) */}
      <div className="w-full relative z-10">
        {children}
      </div>
    </div>
  );
};
