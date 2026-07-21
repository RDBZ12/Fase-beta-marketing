import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, Database } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string; 
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
}

export interface FetchDataParams {
  pageIndex: number;
  pageSize: number;
  searchTerm: string;
  sortBy: string | null;
  sortDesc: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  fetchData: (params: FetchDataParams) => Promise<{ data: T[]; count: number } | null>;
  filtersNode?: React.ReactNode;
  onRowClick?: (item: T) => void;
  refreshTrigger?: any;
}

export function DataTable<T extends { id?: string | number } | any>({ 
  columns, 
  fetchData, 
  filtersNode,
  onRowClick,
  refreshTrigger 
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Table State
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedSearch !== searchTerm) {
        setDebouncedSearch(searchTerm);
        setPageIndex(0); // Reset to first page on search
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  // Reset page when refreshTrigger changes
  useEffect(() => {
    setPageIndex(0);
  }, [refreshTrigger]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        pageIndex,
        pageSize,
        searchTerm: debouncedSearch,
        sortBy,
        sortDesc
      });
      if (result) {
        setData(result.data);
        setTotalCount(result.count);
      } else {
        setData([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Error fetching table data:", err);
      setData([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, [pageIndex, pageSize, debouncedSearch, sortBy, sortDesc, fetchData, refreshTrigger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (key?: string) => {
    if (!key) return;
    if (sortBy === key) {
      if (sortDesc) {
        setSortBy(null);
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortBy(key);
      setSortDesc(false);
    }
    setPageIndex(0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 relative z-10">
      
      {/* Top Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm font-medium placeholder:text-slate-400"
          />
        </div>

        {filtersNode && (
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {filtersNode}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 text-[11px] font-bold tracking-wider uppercase ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors select-none' : ''}`}
                    onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {col.header}
                      {col.sortable && sortBy === col.accessorKey && (
                        sortDesc ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Skeletons
                Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-20 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No se encontraron resultados</h3>
                    <p className="text-slate-500 text-sm mt-1">Intenta ajustando tu búsqueda o filtros.</p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr 
                    key={(item as any).id_pago || (item as any).id_publicacion || (item as any).id_lead || (item as any).id || (item as any).id_usuario || idx} 
                    onClick={() => onRowClick?.(item)}
                    className={`group transition-all duration-200 ${onRowClick ? 'cursor-pointer hover:bg-slate-50:bg-slate-800/50 hover:shadow-sm relative z-0 hover:z-10' : ''}`}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                        {col.cell 
                          ? col.cell(item) 
                          : col.accessorKey 
                            ? (item as any)[col.accessorKey] 
                            : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination & Info */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-500">
            {totalCount > 0 ? (
              <>Mostrando <span className="font-bold text-slate-700">{(pageIndex * pageSize) + 1}</span> a <span className="font-bold text-slate-700">{Math.min((pageIndex + 1) * pageSize, totalCount)}</span> de <span className="font-bold text-slate-700">{totalCount}</span> registros {searchTerm ? '(filtrados)' : ''}</>
            ) : (
              '0 registros'
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Filas:</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                disabled={pageIndex === 0 || loading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-slate-600 px-2">
                Página {totalCount === 0 ? 0 : pageIndex + 1} de {totalPages}
              </div>
              <button
                onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1 || loading || totalCount === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
