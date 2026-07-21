import React from 'react';
import {
  LayoutDashboard, Megaphone, Inbox, Settings, Zap,
  UserCog, FileText, CreditCard, Compass, Briefcase, ShieldAlert
} from 'lucide-react';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rolUsuario: number | null;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Principal (Operaciones Diarias)',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'campanas', label: 'Mis Campañas', icon: Megaphone },
      { id: 'leads', label: 'Leads (CRM & Inbox)', icon: Inbox },
    ],
  },
  {
    title: 'Gestión y Finanzas',
    items: [
      { id: 'clientes', label: 'Clientes', icon: Briefcase },
      { id: 'usuarios', label: 'Usuarios (Equipo)', icon: UserCog },
      { id: 'pagos', label: 'Pagos', icon: CreditCard },
    ],
  },
  {
    title: 'Analítica y Control Global',
    items: [
      { id: 'consultas', label: 'Explorador de Datos', icon: Compass },
      { id: 'reportes', label: 'Reportes', icon: FileText },
      { id: 'admin_campanas', label: 'Auditoría de Campañas', icon: ShieldAlert },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
];

const permisosRol: Record<number, string[]> = {
  1: [
    'dashboard', 'campanas', 'leads', 'clientes', 'usuarios', 
    'pagos', 'consultas', 'reportes', 'admin_campanas', 'ajustes'
  ],
  2: ['dashboard', 'campanas'],
  3: ['dashboard', 'campanas', 'leads'],
  4: ['dashboard', 'campanas', 'reportes'],
  5: ['dashboard', 'campanas', 'leads', 'reportes'],
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, rolUsuario }) => {
  const { profile } = useUser();

  const initials = profile
    ? `${profile.nombre?.charAt(0) || ''}${profile.apellido?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  // Array plano de permisos para el usuario actual
  const permisosActuales = rolUsuario && permisosRol[rolUsuario] 
    ? permisosRol[rolUsuario] 
    : [];

  return (
    <aside className="w-72 bg-[#0B1120] border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">MarketIA</span>
      </div>

      <div className="px-4 flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar">
        {menuGroups.map((group, index) => {
          // Filtrar items de este grupo según el rol del usuario
          const itemsFiltrados = group.items.filter(item => permisosActuales.includes(item.id));
          
          if (itemsFiltrados.length === 0) return null; // No mostrar grupo si no hay items permitidos

          return (
            <div key={index}>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </p>
              <nav className="space-y-1">
                {itemsFiltrados.map((item) => {
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
                      {isActive && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
        <button
          onClick={() => setActiveTab('perfil')}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5 flex items-center gap-3 hover:bg-slate-800 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
            {initials || 'US'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate group-hover:text-white transition-colors">
              {profile ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Usuario' : 'Cargando...'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {profile?.nombre_rol ?? 'Sin rol'}
            </p>
          </div>
        </button>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </aside>
  );
};
