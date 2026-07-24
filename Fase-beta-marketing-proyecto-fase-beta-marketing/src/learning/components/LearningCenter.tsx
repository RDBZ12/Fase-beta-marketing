// src/learning/components/LearningCenter.tsx
import { useState, useMemo } from 'react';
import { Search, Map, Book, HelpCircle, X, ChevronRight, Play, Clock, Target, ListChecks, ArrowRight } from 'lucide-react';
import { learningResources, MODULE_NAMES, type LearningResource, type ModuleId } from '../data/resources';

export default function LearningCenter({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(new Set(['inicio', 'campanas', 'perfil']));

  const handleStartTour = (flowId: string) => {
    window.dispatchEvent(new CustomEvent('marketdev_start_tour', { detail: flowId }));
    onClose();
  };

  const toggleModule = (moduleId: ModuleId) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // Agrupación y filtrado
  const groupedResources = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = learningResources.filter(r => 
      r.title.toLowerCase().includes(term) || 
      (r.description && r.description.toLowerCase().includes(term))
    );

    const groups = {} as Record<ModuleId, LearningResource[]>;
    // Inicializar grupos según MODULE_NAMES
    (Object.keys(MODULE_NAMES) as ModuleId[]).forEach(mId => {
      groups[mId] = [];
    });

    filtered.forEach(r => {
      if (groups[r.moduleId]) {
        groups[r.moduleId].push(r);
      }
    });

    return groups;
  }, [search]);

  // Icono helper
  const ResourceIcon = ({ type, size = 16, className = '' }: { type: string, size?: number, className?: string }) => {
    if (type === 'tour') return <Map size={size} className={className} />;
    if (type === 'guide') return <Book size={size} className={className} />;
    return <HelpCircle size={size} className={className} />;
  };

  const ColorHelper = ({ type }: { type: string }) => {
    if (type === 'tour') return 'text-violet-600 bg-violet-100';
    if (type === 'guide') return 'text-emerald-600 bg-emerald-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[99999] p-4 sm:p-8 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex h-[85vh] overflow-hidden relative border border-slate-200">
        
        {/* Sidebar Izquierdo (Navegación tipo GitBook) */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col h-full flex-shrink-0">
          
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800">Academia MarketIA</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en la documentación..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-3 scrollbar-thin scrollbar-thumb-slate-300">
            {(Object.keys(MODULE_NAMES) as ModuleId[]).map(moduleId => {
              const resourcesInModule = groupedResources[moduleId];
              if (resourcesInModule.length === 0 && search.length > 0) return null; // Ocultar si filtramos y no hay nada

              const isExpanded = expandedModules.has(moduleId) || search.length > 0;

              return (
                <div key={moduleId} className="mb-1">
                  <button
                    onClick={() => toggleModule(moduleId)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <ChevronRight 
                      size={16} 
                      className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                    <span className="font-semibold text-sm">{MODULE_NAMES[moduleId]}</span>
                    <span className="ml-auto text-xs font-medium bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                      {resourcesInModule.length}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-6 mt-1 flex flex-col gap-0.5 pb-2">
                      {resourcesInModule.length > 0 ? (
                        resourcesInModule.map(r => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedResource(r)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2.5 transition-colors ${
                              selectedResource?.id === r.id 
                                ? 'bg-violet-100 text-violet-800 font-medium' 
                                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                          >
                            <ResourceIcon type={r.type} size={16} className={`mt-0.5 shrink-0 ${selectedResource?.id === r.id ? 'text-violet-600' : 'text-slate-400'}`} />
                            <span className="leading-tight">{r.title}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-400">Próximamente...</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Principal Derecho (Visor de Contenido) */}
        <div className="flex-1 bg-white relative flex flex-col h-full overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors z-10">
            <X size={20} />
          </button>

          {selectedResource ? (
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-thin scrollbar-thumb-slate-300">
              <div className="max-w-3xl mx-auto">
                {/* Cabecera del recurso */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ColorHelper({ type: selectedResource.type })}`}>
                    <ResourceIcon type={selectedResource.type} size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-violet-600 tracking-wide uppercase mb-1">
                      {MODULE_NAMES[selectedResource.moduleId]}
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                      {selectedResource.title}
                    </h1>
                  </div>
                </div>

                {/* Renderizado específico por tipo de recurso */}
                
                {/* 1. TOUR INTERACTIVO */}
                {selectedResource.type === 'tour' && (
                  <div className="animate-fade-in-up">
                    <p className="text-lg text-slate-600 mb-8">{selectedResource.description}</p>
                    
                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-violet-600">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">Tiempo Estimado</h4>
                          <p className="text-slate-600 text-sm">{selectedResource.estimatedTime || '5 minutos'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-emerald-600">
                          <Target size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">Objetivo</h4>
                          <p className="text-slate-600 text-sm leading-snug">{selectedResource.learningObjective || 'Dominar esta funcionalidad del sistema.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-10">
                      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                        <ListChecks size={20} className="text-slate-500" />
                        <h3 className="font-bold text-slate-800">¿Qué aprenderemos en este tour?</h3>
                      </div>
                      <div className="p-6">
                        <ul className="space-y-4">
                          {selectedResource.stepsSummary?.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <span className="text-slate-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-center border-t border-slate-100 pt-8 mt-8">
                      <button 
                        onClick={() => handleStartTour(selectedResource.id.replace('tour-', ''))}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-lg font-bold py-4 px-10 rounded-2xl shadow-xl shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300 transition-all hover:-translate-y-1 flex items-center gap-3"
                      >
                        <Play size={20} fill="currentColor" />
                        Iniciar Tour Interactivo
                        <ArrowRight size={20} className="opacity-70" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. PREGUNTA FRECUENTE (FAQ) */}
                {selectedResource.type === 'faq' && (
                  <div className="animate-fade-in-up">
                    <div className="prose prose-violet prose-lg max-w-none text-slate-700 leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: selectedResource.guiaContenido || '' }} 
                    />
                    
                    <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                      <HelpCircle size={24} className="text-blue-500 shrink-0" />
                      <div>
                        <h4 className="font-bold text-blue-900 mb-1">¿No encontraste lo que buscabas?</h4>
                        <p className="text-blue-800 text-sm">Nuestro equipo de soporte técnico está disponible para ayudarte. Envía un correo a soporte@marketdev.com o abre un ticket desde tu panel.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GUÍA ESCRITA */}
                {selectedResource.type === 'guide' && (
                  <div className="animate-fade-in-up">
                    {selectedResource.description && (
                      <p className="text-xl text-slate-500 font-light mb-8 pb-8 border-b border-slate-200">
                        {selectedResource.description}
                      </p>
                    )}
                    <div className="prose prose-violet prose-lg max-w-none text-slate-700 leading-relaxed" 
                         dangerouslySetInnerHTML={{ __html: selectedResource.guiaContenido || '' }} 
                    />
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-24 h-24 bg-violet-100 text-violet-300 rounded-full flex items-center justify-center mb-6">
                <Book size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido a la Academia</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Selecciona un módulo en el menú lateral o utiliza el buscador para encontrar guías, respuestas rápidas y tours interactivos de la plataforma.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
