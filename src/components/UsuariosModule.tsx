import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Usuario, Rol } from '../types';
import {
  Users, Plus, Pencil, Trash2, X, Save,
  ShieldCheck, Mail, Phone, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react';

const ROL_COLORS: Record<number, string> = {
  1: 'bg-violet-100 text-violet-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-amber-100 text-amber-700',
  5: 'bg-rose-100 text-rose-700',
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  usuario?: Usuario | null;
  roles: Rol[];
}

const UsuarioModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, usuario, roles }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState<'activo' | 'inactivo'>('activo');
  const [idRol, setIdRol] = useState(3);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setApellido(usuario.apellido);
      setCorreo(usuario.correo);
      setTelefono(usuario.telefono || '');
      setEstado(usuario.estado);
      setIdRol(usuario.id_rol);
      setPassword('');
    } else {
      setNombre(''); setApellido(''); setCorreo('');
      setTelefono(''); setEstado('activo'); setIdRol(3); setPassword('');
    }
    setError('');
  }, [usuario, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) return setError('El nombre es obligatorio.');
    if (!correo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Correo inválido.');
    if (!usuario && password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setSaving(true);
    try {
      if (usuario) {
        // Update existing profile
        const { error: upErr } = await supabase
          .from('usuarios')
          .update({ nombre, apellido, telefono, estado, id_rol: idRol })
          .eq('id_usuario', usuario.id_usuario);
        if (upErr) throw upErr;
      } else {
        // Create new user via Supabase Auth Admin API (needs service role — use edge function in prod)
        // For now: create auth user then insert profile
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: correo,
          password,
          email_confirm: true,
          user_metadata: { nombre, apellido, id_rol: idRol },
        });
        if (authErr) throw authErr;
        if (authData.user) {
          const { error: insertErr } = await supabase
            .from('usuarios')
            .upsert({
              id_usuario: authData.user.id,
              nombre, apellido, correo,
              telefono, estado, id_rol: idRol,
            });
          if (insertErr) throw insertErr;
        }
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(['nombre', 'apellido'] as const).map((field) => (
              <div key={field}>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {field.charAt(0).toUpperCase() + field.slice(1)} *
                </label>
                <input
                  type="text"
                  value={field === 'nombre' ? nombre : apellido}
                  onChange={(e) => field === 'nombre' ? setNombre(e.target.value) : setApellido(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Correo *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={!!usuario}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-60"
                required
              />
            </div>
          </div>

          {!usuario && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Contraseña *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as 'activo' | 'inactivo')}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rol *
            </label>
            <select
              value={idRol}
              onChange={(e) => setIdRol(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {roles.map(r => (
                <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Module ─────────────────────────────────────────────────────────────
export const UsuariosModule: React.FC = () => {
  const { isAdmin } = useUser();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: usrs }, { data: rls }] = await Promise.all([
      supabase.from('usuarios').select('*, roles(nombre_rol)').order('nombre'),
      supabase.from('roles').select('*').order('id_rol'),
    ]);
    if (usrs) {
      setUsuarios(usrs.map((u: any) => ({
        ...u,
        nombre_rol: u.roles?.nombre_rol,
      })));
    }
    if (rls) setRoles(rls as Rol[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    await supabase.from('usuarios').delete().eq('id_usuario', id);
    fetchAll();
  };

  const filtered = usuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-500">Acceso restringido</h2>
        <p className="text-xs text-slate-400 mt-1">Solo el Administrador puede gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /> Gestión de Usuarios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Administra cuentas y roles del sistema</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Usuario', 'Correo', 'Teléfono', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => (
                  <tr key={u.id_usuario} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{u.nombre} {u.apellido}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.correo}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${ROL_COLORS[u.id_rol] ?? 'bg-slate-100 text-slate-600'}`}>
                        {u.nombre_rol ?? `Rol ${u.id_rol}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.estado === 'activo'
                        ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ToggleRight className="w-3.5 h-3.5" /> Activo</span>
                        : <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><ToggleLeft className="w-3.5 h-3.5" /> Inactivo</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id_usuario)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        onSaved={fetchAll}
        usuario={editingUser}
        roles={roles}
      />
    </div>
  );
};
