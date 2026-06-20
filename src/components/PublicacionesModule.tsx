import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Publicacion, RedSocial, TipoContenido, Campaign } from '../types';
import {
  Globe, Plus, Pencil, Trash2, X, Save, Search,
  Loader2, Calendar, Image, AlignLeft,
} from 'lucide-react';

const ESTADO_COLORS: Record<string, string> = {
  Programada: 'bg-blue-100 text-blue-700',
  Publicada:  'bg-emerald-100 text-emerald-700',
  Borrador:   'bg-slate-100 text-slate-600',
  Cancelada:  'bg-rose-100 text-rose-500',
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean; onClose: () => void; onSaved: () => void;
  pub?: Publicacion | null;
  redes: RedSocial[]; tipos: TipoContenido[]; campaigns: Campaign[];
}

const PubModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, pub, redes, tipos, campaigns }) => {
  const [titulo, setTitulo]             = useState('');
  const [contenido, setContenido]       = useState('');
  const [fechaPub, setFechaPub]         = useState('');
  const [estado, setEstado]             = useState<Publicacion['estado']>('Borrador');
  const [idRed, setIdRed]               = useState<number | ''>('');
  const [idTipo, setIdTipo]             = useState<number | ''>('');
  const [idCampana, setIdCampana]       = useState<string | ''>('');
  const [imagenUrl, setImagenUrl]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (pub) {
      setTitulo(pub.titulo); setContenido(pub.contenido);
      setFechaPub(pub.fecha_publicacion?.slice(0, 16) ?? '');
      setEstado(pub.estado); setIdRed(pub.id_red ?? '');
      setIdTipo(pub.id_tipo_contenido ?? ''); setIdCampana(pub.id_campana ?? '');
      setImagenUrl(pub.imagen_url ?? '');
    } else {
      setTitulo(''); setContenido('');
      setFechaPub(new Date().toISOString().slice(0, 16));
      setEstado('Borrador'); setIdRed(''); setIdTipo(''); setIdCampana(''); setImagenUrl('');
    }
    setError('');
  }, [pub, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim())    return setError('El título es obligatorio.');
    if (!contenido.trim()) return setError('El contenido es obligatorio.');
    if (!idRed)            return setError('La red social es obligatoria.');
    if (!fechaPub)         return setError('La fecha de publicación es obligatoria.');
    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(), contenido: contenido.trim(),
        fecha_publicacion: new Date(fechaPub).toISOString(),
        estado, id_red: idRed || null, id_tipo_contenido: idTipo || null,
        id_campana: idCampana || null, imagen_url: imagenUrl || null,
      };
      if (pub) {
        const { error: e } = await supabase.from('publicaciones').update(payload).eq('id_publicacion', pub.id_publicacion);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('publicaciones').insert([payload]);
        if (e) throw e;
      }
      onSaved(); onClose();
    } catch (err: any) { setError(err.message || 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  const cls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const lbl = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{pub ? 'Editar Publicación' : 'Nueva Publicación'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}
          <div>
            <label className={lbl}>Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className={cls} required />
          </div>
          <div>
            <label className={lbl}>Contenido *</label>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={4}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Red Social *</label>
              <select value={idRed} onChange={e => setIdRed(Number(e.target.value))} className={cls} required>
                <option value="">Seleccionar...</option>
                {redes.filter(r => r.estado === 'activo').map(r => <option key={r.id_red} value={r.id_red}>{r.nombre_red}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tipo de Contenido</label>
              <select value={idTipo} onChange={e => setIdTipo(Number(e.target.value))} className={cls}>
                <option value="">Seleccionar...</option>
                {tipos.map(t => <option key={t.id_tipo_contenido} value={t.id_tipo_contenido}>{t.nombre_tipo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Fecha de Publicación *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="datetime-local" value={fechaPub} onChange={e => setFechaPub(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
            </div>
            <div>
              <label className={lbl}>Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value as Publicacion['estado'])} className={cls}>
                {['Borrador','Programada','Publicada','Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Campaña asociada</label>
            <select value={idCampana} onChange={e => setIdCampana(e.target.value)} className={cls}>
              <option value="">Sin campaña</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>URL de Imagen</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="url" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)}
                placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export const PublicacionesModule: React.FC = () => {
  const { isCommunityOrAbove, isMarketingOrAbove } = useUser();
  const [pubs, setPubs]         = useState<Publicacion[]>([]);
  const [redes, setRedes]       = useState<RedSocial[]>([]);
  const [tipos, setTipos]       = useState<TipoContenido[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterRed, setFilterRed]       = useState('todos');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editing, setEditing]           = useState<Publicacion | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: ps }, { data: rs }, { data: ts }, { data: cs }] = await Promise.all([
      supabase.from('publicaciones').select('*, redes_sociales(nombre_red), tipos_contenido(nombre_tipo), campaigns(nombre_campana)').order('fecha_publicacion', { ascending: false }),
      supabase.from('redes_sociales').select('*').eq('estado', 'activo'),
      supabase.from('tipos_contenido').select('*'),
      supabase.from('campaigns').select('id, nombre_campana, estado'),
    ]);
    if (ps) setPubs(ps.map((p: any) => ({
      ...p,
      nombre_red:   p.redes_sociales?.nombre_red,
      nombre_tipo:  p.tipos_contenido?.nombre_tipo,
      nombre_campana: p.campaigns?.nombre_campana,
    })));
    if (rs) setRedes(rs as RedSocial[]);
    if (ts) setTipos(ts as TipoContenido[]);
    if (cs) setCampaigns(cs.map((c: any) => ({ id: c.id, name: c.nombre_campana, channel: 'Multi', status: c.estado, leads: 0, ctr: 0, reach: '0', startDate: '' })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await supabase.from('publicaciones').delete().eq('id_publicacion', id);
    fetchAll();
  };

  const filtered = pubs.filter(p => {
    const ms = `${p.titulo} ${p.contenido}`.toLowerCase().includes(search.toLowerCase());
    const me = filterEstado === 'todos' || p.estado === filterEstado;
    const mr = filterRed === 'todos' || String(p.id_red) === filterRed;
    return ms && me && mr;
  });

  const statsCounts = ['Programada','Publicada','Borrador','Cancelada'].map(e => ({ label: e, count: pubs.filter(p => p.estado === e).length }));
  const cls = 'px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" /> Publicaciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de publicaciones en redes sociales</p>
        </div>
        {isCommunityOrAbove && (
          <button onClick={() => { setEditing(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all">
            <Plus className="w-3.5 h-3.5" /> Nueva Publicación
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {statsCounts.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-black ${ESTADO_COLORS[s.label]?.split(' ')[1] ?? 'text-slate-700'}`}>{s.count}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar publicaciones..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <select value={filterRed} onChange={e => setFilterRed(e.target.value)} className={cls}>
          <option value="todos">Todas las redes</option>
          {redes.map(r => <option key={r.id_red} value={r.id_red}>{r.nombre_red}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className={cls}>
          <option value="todos">Todos los estados</option>
          {['Borrador','Programada','Publicada','Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16">
          <AlignLeft className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">No hay publicaciones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id_publicacion} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              {p.imagen_url && (
                <div className="h-36 overflow-hidden">
                  <img src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight flex-1">{p.titulo}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLORS[p.estado] ?? 'bg-slate-100 text-slate-600'}`}>{p.estado}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{p.contenido}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    {p.nombre_red && <p className="text-[10px] font-bold text-blue-600">{p.nombre_red}</p>}
                    <p className="text-[10px] text-slate-400">{new Date(p.fecha_publicacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {isCommunityOrAbove && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(p); setIsModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      {isMarketingOrAbove && (
                        <button onClick={() => handleDelete(p.id_publicacion)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PubModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSaved={fetchAll} pub={editing} redes={redes} tipos={tipos} campaigns={campaigns} />
    </div>
  );
};
