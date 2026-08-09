import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Lead, Segmento, Campaign } from '../types';
import {
  Users, Plus, Pencil, Trash2, X, Save,
  Search, Loader2, Mail, Phone, Tag, Megaphone,
  MessageSquare, Wand2
} from 'lucide-react';
import { sendKapsoMessage } from '../lib/whatsappService';

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
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [selectedWhatsAppLead, setSelectedWhatsAppLead] = useState<Lead | null>(null);

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
                        {l.telefono && (
                          <button onClick={() => { setSelectedWhatsAppLead(l); setIsWhatsAppOpen(true); }}
                            title="Enviar WhatsApp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
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

      {selectedWhatsAppLead && (
        <WhatsAppModal
          isOpen={isWhatsAppOpen}
          onClose={() => { setIsWhatsAppOpen(false); setSelectedWhatsAppLead(null); }}
          lead={selectedWhatsAppLead}
          onSent={fetchAll}
        />
      )}
    </div>
  );
};

// ─── WhatsApp modal sub-component ────────────────────────────────────────────
interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSent?: () => void;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, lead, onSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const TEMPLATES = [
    { id: 'bienvenida', label: 'Mensaje de Bienvenida', text: `Hola ${lead.nombre}, gracias por registrarte en nuestra plataforma de marketing. ¿En qué podemos ayudarte hoy?` },
    { id: 'seguimiento', label: 'Seguimiento de Interés', text: `Hola ${lead.nombre}, queríamos dar seguimiento a tu interés en "${lead.interes || 'Servicio de Marketing'}" de nuestra plataforma. ¿Tienes tiempo para una breve llamada hoy?` },
    { id: 'promocion', label: 'Promoción Especial', text: `¡Hola ${lead.nombre}! Te escribimos de parte de Marketdev para comentarte que este mes tenemos un 15% de descuento en la contratación de nuevas campañas digitales. ¿Te interesaría recibir más detalles?` },
  ];

  const handleTemplateSelect = (text: string) => {
    setMessage(text);
  };

  const handleGenerateAI = async () => {
    setGenerating(true);
    setError('');
    
    const systemPrompt = `Eres un asistente de marketing profesional.
Crea un mensaje corto y persuasivo para enviar por WhatsApp a un cliente potencial (Lead).
El mensaje debe ser directo, amigable y respetuoso. Debe invitar al cliente a conversar o responder.`;
    
    const userPrompt = `Escribe un mensaje de WhatsApp personalizado para ${lead.nombre}.
Su interés registrado es: "${lead.interes || 'Servicio de Marketing Digital'}".
El tono debe ser amigable y profesional. Mantén el mensaje corto (máximo de 3-4 oraciones) e incluye un llamado a la acción claro y amigable. No uses texto de marcador de posición ni corchetes.`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
      });

      if (!response.ok) throw new Error(`Error de Gemini API: ${response.status}`);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setMessage(text.trim());
    } catch (err: any) {
      setError(err.message || 'Error al generar el mensaje con Inteligencia Artificial.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return setError('El mensaje no puede estar vacío.');
    if (!lead.telefono) return setError('El lead no tiene un teléfono configurado.');

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      await sendKapsoMessage(lead.telefono, message);
      setSuccess(true);
      
      if (lead.estado === 'Nuevo') {
        await supabase.from('leads').update({ estado: 'Contactado' }).eq('id_lead', lead.id_lead);
        onSent?.();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el mensaje por WhatsApp. Asegúrate de tener la pasarela de OpenWA iniciada.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Enviar WhatsApp</h3>
              <p className="text-[10px] text-slate-400 font-medium">Lead: {lead.nombre} ({lead.telefono})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-4">
          {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}
          {success && <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">¡Mensaje enviado con éxito por WhatsApp!</div>}

          {/* Plantillas y Botón de IA */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex-1">
              <label className={labelCls}>Usar Plantilla</label>
              <select onChange={(e) => handleTemplateSelect(e.target.value)} className={inputCls} defaultValue="">
                <option value="" disabled>Selecciona una plantilla...</option>
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.text}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generating}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all h-8 sm:w-auto"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {generating ? 'Escribiendo...' : 'Redactar con IA'}
            </button>
          </div>

          {/* Mensaje */}
          <div>
            <label className={labelCls}>Mensaje de WhatsApp</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje aquí o utiliza el redactor de IA para crear uno personalizado..."
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Footer botones */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={sending || success}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-emerald-100"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{sending ? 'Enviando...' : 'Enviar Mensaje'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
