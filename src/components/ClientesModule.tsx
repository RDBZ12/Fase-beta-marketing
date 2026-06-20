import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Cliente, Campaign } from '../types';
import {
  Building2, Plus, Pencil, Trash2, X, Save, Phone, Mail,
  MapPin, Search, Loader2,
  ToggleRight, ToggleLeft, Megaphone, Eye,
} from 'lucide-react';

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(f: Partial<Cliente>): string {
  if (!f.nombre_empresa?.trim())  return 'El nombre de empresa es obligatorio.';
  if (!f.telefono?.trim())        return 'El teléfono es obligatorio.';
  if (!f.estado)                  return 'El estado es obligatorio.';
  if (f.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo))
                                  return 'El correo no es válido.';
  return '';
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  cliente?: Cliente | null;
}

const ClienteModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, cliente }) => {
  const [form, setForm] = useState<Partial<Cliente>>({
    nombre_empresa: '', contacto: '', telefono: '', correo: '', direccion: '', estado: 'activo',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    setForm(cliente
      ? { ...cliente }
      : { nombre_empresa: '', contacto: '', telefono: '', correo: '', direccion: '', estado: 'activo' }
    );
    setError('');
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const set = (k: keyof Cliente, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(form);
    if (err) return setError(err);
    setSaving(true);
    try {
      const payload = {
        nombre_empresa: form.nombre_empresa!.trim(),
        contacto:  form.contacto?.trim() || null,
        telefono:  form.telefono!.trim(),
        correo:    form.correo?.trim() || null,
        direccion: form.direccion?.trim() || null,
        estado:    form.estado,
      };
      if (cliente) {
        const { error } = await supabase.from('clientes').update(payload).eq('id_cliente', cliente.id_cliente);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert([payload]);
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string, key: keyof Cliente, type = 'text',
    placeholder = '', icon?: React.ReactNode, required = false
  ) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && ' *'}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          value={(form[key] as string) ?? ''}
          onChange={e => set(key, e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'px-3'} pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {field('Nombre de Empresa', 'nombre_empresa', 'text', 'Ej. Tabacalera del Norte S.A.', <Building2 className="w-3.5 h-3.5" />, true)}

          <div className="grid grid-cols-2 gap-3">
            {field('Persona de Contacto', 'contacto', 'text', 'Ej. Juan Pérez')}
            {field('Teléfono', 'telefono', 'tel', 'Ej. 809-555-0000', <Phone className="w-3.5 h-3.5" />, true)}
          </div>

          {field('Correo Electrónico', 'correo', 'email', 'empresa@correo.com', <Mail className="w-3.5 h-3.5" />)}
          {field('Dirección', 'direccion', 'text', 'Ej. Av. 27 de Febrero #100, Santo Domingo', <MapPin className="w-3.5 h-3.5" />)}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Estado *
            </label>
            <select
              value={form.estado}
              onChange={e => set('estado', e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
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

// ─── Detail Panel ─────────────────────────────────────────────────────────────
interface DetailProps {
  cliente: Cliente;
  onClose: () => void;
}

const ClienteDetail: React.FC<DetailProps> = ({ cliente, onClose }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('campaigns')
        .select('id, nombre_campana, estado, channel, leads, ctr')
        .eq('id_cliente', cliente.id_cliente)
        .order('created_at', { ascending: false });
      setCampaigns((data ?? []).map((d: any) => ({
        id: d.id, name: d.nombre_campana ?? '',
        status: d.estado, channel: d.channel,
        leads: d.leads ?? 0, ctr: d.ctr ?? 0, reach: '0', startDate: '',
      })));
      setLoading(false);
    };
    fetch();
  }, [cliente.id_cliente]);

  const STATUS_COLOR: Record<string, string> = {
    Activa:     'bg-emerald-100 text-emerald-700',
    Pausada:    'bg-amber-100 text-amber-700',
    Completada: 'bg-slate-100 text-slate-600',
    Borrador:   'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{cliente.nombre_empresa}</h3>
            <p className="text-[10px] text-slate-500">{cliente.contacto || '—'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{cliente.telefono}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{cliente.correo || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 col-span-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{cliente.direccion || '—'}</span>
        </div>
      </div>

      {/* Campaigns */}
      <div className="px-5 pb-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Megaphone className="w-3.5 h-3.5" /> Campañas asociadas
        </p>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin campañas asociadas</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-700">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.channel} · {c.leads.toLocaleString()} leads</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Module ─────────────────────────────────────────────────────────────
export const ClientesModule: React.FC = () => {
  const { isMarketingOrAbove } = useUser();
  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [detailCliente, setDetailCliente]   = useState<Cliente | null>(null);

  const fetchClientes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_empresa');
    setClientes((data as Cliente[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente? Sus campañas asociadas perderán la referencia.')) return;
    await supabase.from('clientes').delete().eq('id_cliente', id);
    if (detailCliente?.id_cliente === id) setDetailCliente(null);
    fetchClientes();
  };

  const filtered = clientes.filter(c => {
    const matchSearch = `${c.nombre_empresa} ${c.contacto ?? ''} ${c.correo ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const statsActivos   = clientes.filter(c => c.estado === 'activo').length;
  const statsInactivos = clientes.filter(c => c.estado === 'inactivo').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" /> Clientes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Administra los clientes de la empresa</p>
        </div>
        {isMarketingOrAbove && (
          <button
            onClick={() => { setEditingCliente(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: clientes.length, color: 'text-slate-700', bg: 'bg-white' },
          { label: 'Activos', value: statsActivos, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Inactivos', value: statsInactivos, color: 'text-slate-500', bg: 'bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 p-4 shadow-sm`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black ${s.color} mt-0.5`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: table */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empresa, contacto o correo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No se encontraron clientes</p>
                {isMarketingOrAbove && (
                  <button
                    onClick={() => { setEditingCliente(null); setIsModalOpen(true); }}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    + Agregar el primero
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      {['Empresa', 'Contacto', 'Teléfono', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(c => (
                      <tr
                        key={c.id_cliente}
                        className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${detailCliente?.id_cliente === c.id_cliente ? 'bg-emerald-50/50' : ''}`}
                        onClick={() => setDetailCliente(prev => prev?.id_cliente === c.id_cliente ? null : c)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
                              {c.nombre_empresa.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{c.nombre_empresa}</p>
                              {c.correo && <p className="text-[10px] text-slate-400">{c.correo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.contacto || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.telefono}</td>
                        <td className="px-4 py-3">
                          {c.estado === 'activo'
                            ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ToggleRight className="w-3.5 h-3.5" /> Activo</span>
                            : <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><ToggleLeft className="w-3.5 h-3.5" /> Inactivo</span>
                          }
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailCliente(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isMarketingOrAbove && (
                              <>
                                <button
                                  onClick={() => { setEditingCliente(c); setIsModalOpen(true); }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id_cliente)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {detailCliente && (
          <div className="w-full lg:w-80 shrink-0">
            <ClienteDetail
              cliente={detailCliente}
              onClose={() => setDetailCliente(null)}
            />
          </div>
        )}
      </div>

      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCliente(null); }}
        onSaved={fetchClientes}
        cliente={editingCliente}
      />
    </div>
  );
};
