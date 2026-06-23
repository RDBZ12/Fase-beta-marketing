import React from 'react';
import {
  LayoutDashboard, Megaphone, BarChart3, Users, Settings, Zap, Eye,
  UserCog, FileText, CreditCard, Globe,
} from 'lucide-react';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rolUsuario: number | null;
}

const menuItems = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'campanas',       label: 'Campañas',       icon: Megaphone },
  { id: 'publicaciones',  label: 'Publicaciones',  icon: Globe },
  { id: 'analytics',      label: 'Analytics',      icon: BarChart3 },
  { id: 'audiencia',      label: 'Leads',          icon: Users },
  { id: 'clientes',       label: 'Clientes',       icon: FileText },
  { id: 'pagos',          label: 'Pagos',          icon: CreditCard },
  { id: 'usuarios',       label: 'Usuarios',       icon: UserCog },
  { id: 'ajustes',        label: 'Ajustes',        icon: Settings },
  { id: 'portal-cliente', label: 'Portal Cliente', icon: Eye },
];

const permisosRol: Record<number, string[]> = {
  1: ['dashboard', 'campanas', 'publicaciones', 'analytics', 'audiencia', 'clientes', 'pagos', 'usuarios', 'ajustes', 'portal-cliente'],
  2: ['dashboard', 'campanas', 'analytics'],
  3: ['dashboard', 'campanas', 'analytics', 'audiencia'],
  4: ['dashboard', 'campanas', 'portal-cliente'],
  5: ['audiencia'],
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, rolUsuario }) => {
  const { profile } = useUser();

  const menuItemsFiltrados = rolUsuario && permisosRol[rolUsuario]
    ? menuItems.filter(item => permisosRol[rolUsuario].includes(item.id))
    : menuItems;

  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-200">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">Marketdev</span>
      </div>

      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Principal
        </p>
        <nav className="space-y-1">
          {menuItemsFiltrados.map((item) => {
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
