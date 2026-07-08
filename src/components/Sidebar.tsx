import React from 'react';
import {
  LayoutDashboard, Megaphone, BarChart3, Users, Settings, Zap, Eye,
  UserCog, FileText, CreditCard, Globe, Compass
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
  { id: 'consultas',      label: 'Explorador de Datos', icon: Compass },
  { id: 'reportes',       label: 'Reportes',       icon: FileText },
];

const permisosRol: Record<number, string[]> = {
  1: ['dashboard', 'campanas', 'publicaciones', 'analytics', 'audiencia', 'clientes', 'pagos', 'usuarios', 'ajustes', 'portal-cliente', 'consultas', 'reportes'],
  2: ['dashboard', 'campanas', 'analytics'],
  3: ['dashboard', 'campanas', 'analytics', 'audiencia'],
  4: ['dashboard', 'campanas', 'portal-cliente', 'reportes'],
  5: ['dashboard', 'campanas', 'audiencia', 'clientes', 'portal-cliente', 'reportes'],
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
    <aside className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">MarketIA</span>
      </div>

      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Administración
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
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('perfil')}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/30">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">
              {profile ? `${profile.nombre} ${profile.apellido}` : 'Cargando...'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {profile?.nombre_rol ?? ''}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
