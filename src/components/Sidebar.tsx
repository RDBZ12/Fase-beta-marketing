import React from 'react';
import {
  LayoutDashboard, Megaphone, BarChart3, Users, Settings,
  Zap, Eye, UserCog, CreditCard, FileText, Globe,
} from 'lucide-react';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile, isAdmin, isGerenciaOrAbove, isMarketingOrAbove, isCommunityOrAbove } = useUser();

  const allItems = [
    { id: 'dashboard',      label: 'Dashboard',       icon: LayoutDashboard, show: true },
    { id: 'portal-cliente', label: 'Portal Cliente',  icon: Eye,             show: true },
    { id: 'campanas',       label: 'Campañas',        icon: Megaphone,       show: isMarketingOrAbove },
    { id: 'publicaciones',  label: 'Publicaciones',   icon: Globe,           show: isCommunityOrAbove },
    { id: 'clientes',       label: 'Clientes',        icon: FileText,        show: isMarketingOrAbove },
    { id: 'audiencia',      label: 'Leads',           icon: Users,           show: true },
    { id: 'analytics',      label: 'Analytics',       icon: BarChart3,       show: isGerenciaOrAbove },
    { id: 'pagos',          label: 'Pagos',           icon: CreditCard,      show: isMarketingOrAbove },
    { id: 'usuarios',       label: 'Usuarios',        icon: UserCog,         show: isAdmin },
    { id: 'ajustes',        label: 'Ajustes',         icon: Settings,        show: true },
  ];

  const menuItems = allItems.filter(i => i.show);
  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-200">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">Marketdev</span>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 flex-1 overflow-y-auto">
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
                {isActive && <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer — user profile */}
      <div className="p-4 border-t border-slate-50">
        <button
          onClick={() => setActiveTab('perfil')}
          className="w-full bg-slate-50 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {profile ? `${profile.nombre} ${profile.apellido}` : 'Cargando...'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {profile?.nombre_rol ?? ''}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
