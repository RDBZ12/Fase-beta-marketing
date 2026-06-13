import React from 'react';
import { LayoutDashboard, Megaphone, BarChart3, Users, Settings, Zap, Eye } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portal-cliente', label: 'Portal Cliente', icon: Eye },
    { id: 'campanas', label: 'Campañas', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audiencia', label: 'Audiencia', icon: Users },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Brand logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-200">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">Marketdev</span>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 flex-1">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Principal
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-50">
        <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
            JD
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Administrador</p>
            <p className="text-[10px] text-slate-400">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
