import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Lead, Segmento, Campaign } from '../types';
import {
  Users, Plus, Pencil, Trash2, X, Save,
  Search, Loader2, Mail, Phone, Tag, Megaphone,
} from 'lucide-react';

const ESTADO_STYLES: Record<string, string> = {
  Nuevo:       'bg-blue-100 text-blue-700',
  Contactado:  'bg-amber-100 text-amber-700',
  Calificado:  'bg-violet-100 text-violet-700',
  Convertido:  'bg-emerald-100 text-emerald-700',
  Perdido:     'bg-rose-100 text-rose-500',
};

const ESTADOS = ['Nuevo', 'Contactado', 'Calificado', 'Convertido', 'Perdido'] as const;

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  lead?: Lead | null;
  segmentos: Segmento[];
  campaigns: Campaign[];
}

const LeadModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, lead, segmentos, campaigns }) => {
  const [nombre, setNombre]       = useState('');
  const [telefono, setTelefono]   = useState('');
  const [correo, setCorreo]       = useState('');
  const [interes, setInteres]     = useState('');
  const [estado, setEstado]       = useState<Lead['estado']>('Nuevo');
  const [idSegmento, setIdSegmento] = useState<number | ''>('');
  const [idCampana, setIdCampana]   = useState<string | ''>('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (lead) {
      setNombre(lead.nombre); setTelefono(lead.telefono ?? '');
      setCorreo(lead.correo ?? ''); setInteres(lead.interes ?? '');
      setEstado(lead.estado);
      setIdSegmento(lead.id_segmento ?? '');
      setIdCampana(lead.id_campana ?? '');
    } else {
      setNombre(''); setTelefono(''); setCorreo('');
      setInteres(''); setEstado('Nuevo'); setIdSegmento(''); setIdCampana('');
    }
    setError('');
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('El nombre es obligatorio.');
    if (!idSegmento)    return setError('El segmento es obligatorio.');
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setError('Correo inválido.');

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        correo: correo.trim() || null,
        interes: interes.trim() || null,
        estado,
        id_segmento: idSegmento || null,
        id_campana: idCampana || null,
      };
      if (lead) {
        const { error: e } = await supabase.from('leads').update(payload).eq('id_lead', lead.id_lead);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('leads').insert([payload]);
        if (e) throw e;
      }
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{lead ? 'Editar Lead' : 'Nuevo Lead'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Interés / Notas</label>
            <textarea value={interes} onChange={e => setInteres(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Segmento *</label>
              <select value={idSegmento} onChange={e => setIdSegmento(Number(e.target.value))} className={inputCls} required>
                <option value="">Seleccionar...</option>
                {segmentos.map(s => <option key={s.id_segmento} value={s.id_segmento}>{s.nombre_segmento}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value as Lead['estado'])} className={inputCls}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Campaña asociada</label>
            <select value={idCampana} onChange={e => setIdCampana(e.target.value)} className={inputCls}>
              <option value="">Sin campaña</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Module ──────────────────────────────────────────────────────────────
export const LeadsModule: React.FC = () => {
  const { isMarketingOrAbove } = useUser();
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [segmentos, setSegmentos]   = useState<Segmento[]>([]);
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterEstado, setFilterEstado]     = useState('todos');
  const [filterSegmento, setFilterSegmento] = useState('todos');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingLead, setEditingLead]       = useState<Lead | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: ls }, { data: sg }, { data: cp }] = await Promise.all([
      supabase.from('leads').select('*, segmentos(nombre_segmento), campaigns(nombre_campana)').order('fecha_registro', { ascending: false }),
      supabase.from('segmentos').select('*').order('nombre_segmento'),
      supabase.from('campaigns').select('id, nombre_campana, estado').eq('estado', 'Activa'),
    ]);
    if (ls) setLeads(ls.map((l: any) => ({
      ...l,
      nombre_segmento: l.segmentos?.nombre_segmento,
      nombre_campana:  l.campaigns?.nombre_campana,
    })));
    if (sg) setSegmentos(sg as Segmento[]);
    if (cp) setCampaigns(cp.map((c: any) => ({ id: c.id, name: c.nombre_campana, channel: 'Multi', status: c.estado, leads: 0, ctr: 0, reach: '0', startDate: '' })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este lead?')) return;
    await supabase.from('leads').delete().eq('id_lead', id);
    fetchAll();
  };

  const handleStatusChange = async (id: string, newEstado: Lead['estado']) => {
    await supabase.from('leads').update({ estado: newEstado }).eq('id_lead', id);
    fetchAll();
  };

  const filtered = leads.filter(l => {
    const matchSearch = `${l.nombre} ${l.correo ?? ''} ${l.telefono ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchEstado   = filterEstado   === 'todos' || l.estado === filterEstado;
    const matchSegmento = filterSegmento === 'todos' || String(l.id_segmento) === filterSegmento;
    return matchSearch && matchEstado && matchSegmento;
  });

  // Stats
  const stats = ESTADOS.map(e => ({ label: e, count: leads.filter(l => l.estado === e).length }));

  const inputCls = 'px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /> Gestión de Leads
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Clientes potenciales generados por campañas</p>
        </div>
        <button onClick={() => { setEditingLead(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-200 transition-all">
          <Plus className="w-3.5 h-3.5" /> Nuevo Lead
        </button>
      </div>

      {/* Stats by estado */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <button key={s.label}
            onClick={() => setFilterEstado(prev => prev === s.label ? 'todos' : s.label)}
            className={`rounded-2xl border p-3 text-center transition-all shadow-sm ${filterEstado === s.label ? 'border-violet-300 bg-violet-50' : 'bg-white border-slate-100 hover:border-violet-200'}`}>
            <p className={`text-2xl font-black ${ESTADO_STYLES[s.label]?.split(' ')[1] ?? 'text-slate-700'}`}>{s.count}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, correo o teléfono..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <select value={filterSegmento} onChange={e => setFilterSegmento(e.target.value)} className={inputCls}>
          <option value="todos">Todos los segmentos</option>
          {segmentos.map(s => <option key={s.id_segmento} value={s.id_segmento}>{s.nombre_segmento}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={inputCls}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No se encontraron leads</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Lead', 'Contacto', 'Segmento', 'Campaña', 'Fecha', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(l => (
                  <tr key={l.id_lead} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {l.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{l.nombre}</p>
                          {l.interes && <p className="text-[10px] text-slate-400 max-w-[140px] truncate">{l.interes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {l.correo && <p className="flex items-center gap-1 text-[10px] text-slate-500"><Mail className="w-3 h-3" />{l.correo}</p>}
                        {l.telefono && <p className="flex items-center gap-1 text-[10px] text-slate-500"><Phone className="w-3 h-3" />{l.telefono}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {l.nombre_segmento
                        ? <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"><Tag className="w-3 h-3" />{l.nombre_segmento}</span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {l.nombre_campana
                        ? <span className="flex items-center gap-1 text-[10px] text-slate-600"><Megaphone className="w-3 h-3 text-slate-400" />{l.nombre_campana}</span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">
                      {new Date(l.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={l.estado}
                        onChange={e => handleStatusChange(l.id_lead, e.target.value as Lead['estado'])}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400 ${ESTADO_STYLES[l.estado] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingLead(l); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isMarketingOrAbove && (
                          <button onClick={() => handleDelete(l.id_lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLead(null); }}
        onSaved={fetchAll}
        lead={editingLead}
        segmentos={segmentos}
        campaigns={campaigns}
      />
    </div>
  );
};
