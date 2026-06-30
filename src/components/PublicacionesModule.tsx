import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import type { Publicacion, RedSocial, TipoContenido, Campaign } from '../types';
import { getPostAnalytics, getAnalyticsByContent, hasAyrshareKey } from '../lib/ayrshare';
import {
  Globe, Plus, Pencil, Trash2, X, Save, Search,
  Loader2, Calendar, Image, AlignLeft, Send, TrendingUp, RefreshCw,
  MessageSquare
} from 'lucide-react';
import { sendWhatsAppTextMessage, sendWhatsAppImageMessage, getOpenWAGroups, getOpenWAContacts } from '../lib/whatsapp';

const ESTADO_COLORS: Record<string, string> = {
  Programada: 'bg-blue-100 text-blue-700',
  Publicada: 'bg-emerald-100 text-emerald-700',
  Borrador: 'bg-slate-100 text-slate-600',
  Cancelada: 'bg-rose-100 text-rose-500',
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean; onClose: () => void; onSaved: () => void;
  pub?: Publicacion | null;
  redes: RedSocial[]; tipos: TipoContenido[]; campaigns: Campaign[];
  onPublishNow: (pub: Publicacion, bypassConfirm?: boolean) => Promise<void>;
}

const getLocalISOString = (dateObj: Date): string => {
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
};

const PubModal: React.FC<ModalProps> = ({ isOpen, onClose, onSaved, pub, redes, tipos, campaigns, onPublishNow }) => {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [fechaPub, setFechaPub] = useState('');
  const [estado, setEstado] = useState<Publicacion['estado']>('Borrador');
  const [idRed, setIdRed] = useState<number | ''>('');
  const [idTipo, setIdTipo] = useState<number | ''>('');
  const [idCampana, setIdCampana] = useState<string | ''>('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pub) {
      setTitulo(pub.titulo); setContenido(pub.contenido);
      setFechaPub(pub.fecha_publicacion ? getLocalISOString(new Date(pub.fecha_publicacion)) : '');
      setEstado(pub.estado); setIdRed(pub.id_red ?? '');
      setIdTipo(pub.id_tipo_contenido ?? ''); setIdCampana(pub.id_campana ?? '');
      setImagenUrl(pub.imagen_url ?? '');
    } else {
      setTitulo(''); setContenido('');
      setFechaPub(getLocalISOString(new Date()));
      setEstado('Borrador'); setIdRed(''); setIdTipo(''); setIdCampana(''); setImagenUrl('');
    }
    setError('');
  }, [pub, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return setError('El título es obligatorio.');
    if (!contenido.trim()) return setError('El contenido es obligatorio.');
    if (!idRed) return setError('La red social es obligatoria.');
    if (!fechaPub) return setError('La fecha de publicación es obligatoria.');
    
    // Validar que no permita fechas pasadas (con 1 minuto de gracia)
    const selectedDate = new Date(fechaPub);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);
    if (selectedDate < now) {
      return setError('La fecha de publicación no puede ser en el pasado.');
    }

    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(), contenido: contenido.trim(),
        fecha_publicacion: new Date(fechaPub).toISOString(),
        estado, id_red: idRed || null, id_tipo_contenido: idTipo || null,
        id_campana: idCampana || null, imagen_url: imagenUrl || null,
      };
      let savedPub: Publicacion | null = null;
      if (pub) {
        const { data, error: e } = await supabase.from('publicaciones')
          .update(payload)
          .eq('id_publicacion', pub.id_publicacion)
          .select('*, redes_sociales(nombre_red), tipos_contenido(nombre_tipo), campaigns(nombre_campana)')
          .single();
        if (e) throw e;
        if (data) {
          savedPub = {
            ...data,
            nombre_red: data.redes_sociales?.nombre_red,
            nombre_tipo: data.tipos_contenido?.nombre_tipo,
            nombre_campana: data.campaigns?.nombre_campana,
          };
        }
      } else {
        const { data, error: e } = await supabase.from('publicaciones')
          .insert([payload])
          .select('*, redes_sociales(nombre_red), tipos_contenido(nombre_tipo), campaigns(nombre_campana)')
          .single();
        if (e) throw e;
        if (data) {
          savedPub = {
            ...data,
            nombre_red: data.redes_sociales?.nombre_red,
            nombre_tipo: data.tipos_contenido?.nombre_tipo,
            nombre_campana: data.campaigns?.nombre_campana,
          };
        }
      }
      onSaved(); onClose();
      if (estado === 'Publicada' && savedPub) {
        onPublishNow(savedPub, true);
      }
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
                {['Borrador', 'Programada', 'Publicada', 'Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
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
            <label className={lbl}>Imagen (archivo local o URL)</label>
            <div className="space-y-3">
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="file" accept="image/*" onChange={handleImageFileChange}
                  className="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-all duration-200" />
              </div>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="url" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)}
                  placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              {imagenUrl && imagenUrl.startsWith('data:image') && (
                <div className="mt-2 relative inline-block">
                  <img src={imagenUrl} alt="Vista previa" className="h-20 w-auto rounded-lg object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setImagenUrl('')}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
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
export const PublicacionesModule: React.FC = () => {
  const { isCommunityOrAbove, isMarketingOrAbove } = useUser();
  const [pubs, setPubs] = useState<Publicacion[]>([]);
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [tipos, setTipos] = useState<TipoContenido[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sharingWhatsAppPub, setSharingWhatsAppPub] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterRed, setFilterRed] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Publicacion | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [fetchingAnalyticsId, setFetchingAnalyticsId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: ps }, { data: rs }, { data: ts }, { data: cs }, { data: ints }] = await Promise.all([
      supabase.from('publicaciones').select('*, redes_sociales(nombre_red), tipos_contenido(nombre_tipo), campaigns(nombre_campana)').order('fecha_publicacion', { ascending: false }),
      supabase.from('redes_sociales').select('*').eq('estado', 'activo'),
      supabase.from('tipos_contenido').select('*'),
      supabase.from('campaigns').select('id, nombre_campana, estado'),
      supabase.from('interacciones').select('*'),
    ]);

    const interactions = ints || [];

    if (ps) setPubs(ps.map((p: any) => {
      const pubInts = interactions.filter((i: any) => i.id_publicacion === p.id_publicacion);
      const likes = pubInts.filter((i: any) => i.tipo_interaccion === 'like').reduce((acc: number, cur: any) => acc + cur.cantidad, 0);
      const comentarios = pubInts.filter((i: any) => i.tipo_interaccion === 'comentario').reduce((acc: number, cur: any) => acc + cur.cantidad, 0);
      const compartidos = pubInts.filter((i: any) => i.tipo_interaccion === 'compartido').reduce((acc: number, cur: any) => acc + cur.cantidad, 0);
      const alcance = pubInts.filter((i: any) => i.tipo_interaccion === 'alcance' || i.tipo_interaccion === 'impresion').reduce((acc: number, cur: any) => acc + cur.cantidad, 0);

      return {
        ...p,
        nombre_red: p.redes_sociales?.nombre_red,
        nombre_tipo: p.tipos_contenido?.nombre_tipo,
        nombre_campana: p.campaigns?.nombre_campana,
        likes,
        comentarios,
        compartidos,
        alcance,
      };
    }));
    if (rs) setRedes(rs as RedSocial[]);
    if (ts) setTipos(ts as TipoContenido[]);
    if (cs) setCampaigns(cs.map((c: any) => ({ id: c.id, name: c.nombre_campana, channel: 'Multi', status: c.estado, leads: 0, ctr: 0, reach: '0', startDate: '' })));
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channelInts = supabase
      .channel('realtime-interacciones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interacciones' },
        () => { fetchAll(); }
      )
      .subscribe();

    const channelPubs = supabase
      .channel('realtime-publicaciones')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'publicaciones' },
        () => { fetchAll(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelInts);
      supabase.removeChannel(channelPubs);
    };
  }, []);

  const handleSyncMetrics = async () => {
    const publicadas = pubs.filter(p => p.estado === 'Publicada');
    if (publicadas.length === 0) {
      alert('No hay publicaciones con estado "Publicada" para sincronizar.');
      return;
    }

    setSyncing(true);
    let updatedCount = 0;
    let realCount = 0;
    let notFoundCount = 0;

    try {
      let history: any[] = [];
      if (hasAyrshareKey()) {
        try {
          const { getPostHistory: fetchHistory } = await import('../lib/ayrshare');
          history = await fetchHistory();
        } catch (_e) { }
      }

      for (const pub of publicadas) {
        try {
          let instagramUrl: string | null = null;
          if (history.length > 0) {
            const pText = pub.contenido.toLowerCase().trim();
            const searchStr = pText.substring(0, Math.min(30, pText.length));

            const match = history.find((h: any) => {
              const hText = (h.post || '').toLowerCase().replace('[sent with free plan] ', '');
              return hText.includes(searchStr) || searchStr.includes(hText.substring(0, Math.min(30, hText.length)));
            });

            if (match) {
              const instaPostId = match.postIds?.find((p: any) => p.platform === 'instagram');
              instagramUrl = instaPostId?.postUrl ?? null;

              const updateData: any = {};
              if (match.id && !pub.ayrshare_post_id) updateData.ayrshare_post_id = match.id;
              if (instagramUrl) updateData.instagram_post_url = instagramUrl;
              if (Object.keys(updateData).length > 0) {
                await supabase.from('publicaciones').update(updateData).eq('id_publicacion', pub.id_publicacion);
              }

              const analytics = await getPostAnalytics(match.id);
              if (analytics && (analytics.source as string) === 'ayrshare_real') {
                const newInts = [
                  { tipo_interaccion: 'like', cantidad: analytics.likes ?? 0, id_publicacion: pub.id_publicacion },
                  { tipo_interaccion: 'comentario', cantidad: analytics.comentarios ?? 0, id_publicacion: pub.id_publicacion },
                  { tipo_interaccion: 'compartido', cantidad: analytics.compartidos ?? 0, id_publicacion: pub.id_publicacion },
                  { tipo_interaccion: 'alcance', cantidad: analytics.alcance ?? 0, id_publicacion: pub.id_publicacion },
                ];
                await supabase.from('interacciones').delete().eq('id_publicacion', pub.id_publicacion);
                await supabase.from('interacciones').insert(newInts);
                realCount++;
              }
              updatedCount++;
            } else {
              notFoundCount++;
            }
          }
        } catch (_pubErr) {
          notFoundCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      await fetchAll();
      const lines = [
        `✅ Sincronización completada`,
        `🔗 ${history.length} posts encontrados en Ayrshare`,
        realCount > 0 ? `🟢 ${realCount} publicaciones con métricas reales` : `⚠️ Analytics no disponibles en el plan actual (se requiere Premium)`,
        notFoundCount > 0 ? `ℹ️ ${notFoundCount} publicaciones sin coincidencia en Ayrshare` : '',
      ].filter(Boolean);
      alert(lines.join('\n'));
    } catch (err: any) {
      alert('Error en sincronización: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    await supabase.from('publicaciones').delete().eq('id_publicacion', id);
    fetchAll();
  };

  const handleFetchAnalytics = async (pub: Publicacion) => {
    setFetchingAnalyticsId(pub.id_publicacion);
    try {
      let analytics: any | null = null;
      let instagramUrl: string | null = null;

      if (pub.ayrshare_post_id) {
        analytics = await getPostAnalytics(pub.ayrshare_post_id);
      } else {
        const result = await getAnalyticsByContent(pub.contenido);
        if (result) {
          analytics = result;
          instagramUrl = result.postUrl ?? null;
        }
      }

      if (analytics && (analytics.source as string) === 'ayrshare_real') {
        const newInts = [
          { tipo_interaccion: 'like', cantidad: analytics.likes ?? 0, id_publicacion: pub.id_publicacion },
          { tipo_interaccion: 'comentario', cantidad: analytics.comentarios ?? 0, id_publicacion: pub.id_publicacion },
          { tipo_interaccion: 'compartido', cantidad: analytics.compartidos ?? 0, id_publicacion: pub.id_publicacion },
          { tipo_interaccion: 'alcance', cantidad: analytics.alcance ?? 0, id_publicacion: pub.id_publicacion },
        ];
        await supabase.from('interacciones').delete().eq('id_publicacion', pub.id_publicacion);
        await supabase.from('interacciones').insert(newInts);
      }

      if (instagramUrl) {
        await supabase.from('publicaciones')
          .update({ instagram_post_url: instagramUrl })
          .eq('id_publicacion', pub.id_publicacion);
      }

      if (!analytics) {
        alert('⚠️ No se encontraron métricas reales para esta publicación.');
      }

      fetchAll();
    } catch (err: any) {
      alert('Error obteniendo analíticas: ' + err.message);
    } finally {
      setFetchingAnalyticsId(null);
    }
  };

  const handlePublishNow = async (pub: Publicacion, bypassConfirm = false) => {
    if (!bypassConfirm && !confirm('¿Estás seguro de que quieres lanzar esta publicación a las redes reales ahora mismo?')) return;

    setPublishingId(pub.id_publicacion);
    try {
      let finalMediaUrl = pub.imagen_url;

      const isLocalOrBase64 = finalMediaUrl && (
        finalMediaUrl.startsWith('data:image') ||
        finalMediaUrl.startsWith('/') ||
        finalMediaUrl.includes('localhost') ||
        finalMediaUrl.includes('127.0.0.1') ||
        finalMediaUrl.includes('10.100.')
      );

      if (isLocalOrBase64 && finalMediaUrl) {
        let blob: Blob;
        let contentType = 'image/png';
        let extension = 'png';

        if (finalMediaUrl.startsWith('data:image')) {
          const match = finalMediaUrl.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            contentType = match[1];
            const b64Data = match[2];
            const byteCharacters = atob(b64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            blob = new Blob(byteArrays, { type: contentType });
            extension = contentType.split('/')[1] || 'png';
          } else {
            throw new Error('Formato base64 de imagen inválido.');
          }
        } else {
          const res = await fetch(finalMediaUrl);
          if (!res.ok) throw new Error('No se pudo descargar la imagen local: ' + finalMediaUrl);
          blob = await res.blob();
          contentType = blob.type || 'image/png';
          extension = contentType.split('/')[1] || 'png';
        }

        const fileName = `pub_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('img').upload(fileName, blob, { contentType });
        if (uploadError) throw new Error('Error al subir imagen al bucket: ' + uploadError.message);

        const { data: publicUrlData } = supabase.storage.from('img').getPublicUrl(fileName);
        finalMediaUrl = publicUrlData.publicUrl;

        await supabase.from('publicaciones').update({ imagen_url: finalMediaUrl }).eq('id_publicacion', pub.id_publicacion);
      }

      let plat = 'facebook';
      const nred = pub.nombre_red?.toLowerCase() || '';
      
      if (nred.includes('what')) {
        setSharingWhatsAppPub(pub);
        setPublishingId(null);
        return;
      }
      
      if (nred.includes('insta')) plat = 'instagram';
      else if (nred.includes('twit') || nred.includes('x')) plat = 'twitter';
      else if (nred.includes('link')) plat = 'linkedin';
      else if (nred.includes('tik')) plat = 'tiktok';
      else if (nred.includes('tele')) plat = 'telegram';

      const { data, error } = await supabase.functions.invoke('publish_social', {
        body: {
          post: pub.contenido,
          platforms: [plat],
          mediaUrls: finalMediaUrl ? [finalMediaUrl] : []
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const updatePayload: any = { estado: 'Publicada' };
      if (data.postId) updatePayload.ayrshare_post_id = data.postId;
      await supabase.from('publicaciones').update(updatePayload).eq('id_publicacion', pub.id_publicacion);

      alert(data.mock ? 'Simulación Exitosa' : '¡Publicado con éxito!');
      fetchAll();
    } catch (err: any) {
      alert('Error publicando: ' + err.message);
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = pubs.filter(p => {
    const ms = `${p.titulo} ${p.contenido}`.toLowerCase().includes(search.toLowerCase());
    const me = filterEstado === 'todos' || p.estado === filterEstado;
    const mr = filterRed === 'todos' || String(p.id_red) === filterRed;
    return ms && me && mr;
  });

  const statsCounts = ['Programada', 'Publicada', 'Borrador', 'Cancelada'].map(e => ({ label: e, count: pubs.filter(p => p.estado === e).length }));
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
        <div className="flex items-center gap-2">
          {isCommunityOrAbove && (
            <button onClick={handleSyncMetrics} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Métricas'}</span>
            </button>
          )}
          {isCommunityOrAbove && (
            <button onClick={() => { setEditing(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all">
              <Plus className="w-3.5 h-3.5" /> Nueva Publicación
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {statsCounts.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-black ${ESTADO_COLORS[s.label]?.split(' ')[1] ?? 'text-slate-700'}`}>{s.count}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

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
          {['Borrador', 'Programada', 'Publicada', 'Cancelada'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

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

                {p.estado === 'Publicada' && (
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 py-1 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100">
                      <span className="text-[9px] font-black text-violet-600 uppercase tracking-wider">📊 Analytics</span>
                      <div className="flex items-center gap-1.5">
                        {(p as any).instagram_post_url && (
                          <a href={(p as any).instagram_post_url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-full hover:bg-pink-100 transition-colors">📸 Ver en Instagram</a>
                        )}
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.ayrshare_post_id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                          {p.ayrshare_post_id ? '🔗 Ayrshare' : 'Sin datos reales'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-0 text-center">
                      <div className="py-2 px-1 border-r border-slate-100">
                        <p className={`text-[14px] font-black ${p.likes != null ? 'text-rose-500' : 'text-slate-300'}`}>{p.likes != null ? p.likes.toLocaleString() : '—'}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">❤️ Likes</p>
                      </div>
                      <div className="py-2 px-1 border-r border-slate-100">
                        <p className={`text-[14px] font-black ${p.comentarios != null ? 'text-blue-500' : 'text-slate-300'}`}>{p.comentarios != null ? p.comentarios.toLocaleString() : '—'}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">💬 Coment.</p>
                      </div>
                      <div className="py-2 px-1 border-r border-slate-100">
                        <p className={`text-[14px] font-black ${p.compartidos != null ? 'text-emerald-500' : 'text-slate-300'}`}>{p.compartidos != null ? p.compartidos.toLocaleString() : '—'}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">🔗 Compart.</p>
                      </div>
                      <div className="py-2 px-1">
                        <p className={`text-[14px] font-black ${p.alcance != null ? 'text-amber-500' : 'text-slate-300'}`}>{p.alcance != null ? p.alcance.toLocaleString() : '—'}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">👁️ Alcance</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    {p.nombre_red && <p className="text-[10px] font-bold text-blue-600">{p.nombre_red}</p>}
                    <p className="text-[10px] text-slate-400">{new Date(p.fecha_publicacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {isCommunityOrAbove && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.estado !== 'Publicada' && (
                        <button onClick={() => handlePublishNow(p)} disabled={publishingId === p.id_publicacion}
                          title="Lanzar a Redes (API Real)"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                          {publishingId === p.id_publicacion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {p.estado === 'Publicada' && (
                        <button
                          onClick={() => handleFetchAnalytics(p)}
                          disabled={fetchingAnalyticsId === p.id_publicacion}
                          title={p.ayrshare_post_id ? 'Actualizar métricas reales' : 'Actualizar métricas'}
                          className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50">
                          {fetchingAnalyticsId === p.id_publicacion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        </button>
                      )}
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
        onSaved={fetchAll} pub={editing} redes={redes} tipos={tipos} campaigns={campaigns}
        onPublishNow={handlePublishNow} />

      {sharingWhatsAppPub && (
        <ShareWhatsAppModal
          isOpen={!!sharingWhatsAppPub}
          onClose={() => setSharingWhatsAppPub(null)}
          publication={sharingWhatsAppPub}
        />
      )}
    </div>
  );
};

interface ShareWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publicacion;
}

const ShareWhatsAppModal: React.FC<ShareWhatsAppModalProps> = ({ isOpen, onClose, publication }) => {
  const { profile } = useUser();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [shareMode, setShareMode] = useState<'select' | 'manual'>('select');
  const [manualPhone, setManualPhone] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [waChats, setWaChats] = useState<{ id: string; name: string; isGroup: boolean }[]>([]);
  const [loadingWaChats, setLoadingWaChats] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      fetchWaChats();
    }
  }, [isOpen]);

  const fetchWaChats = async () => {
    setLoadingWaChats(true);
    try {
      const clientSessionName = profile?.id_usuario 
        ? (localStorage.getItem(`client_whatsapp_session_${profile.id_usuario}`) || undefined)
        : undefined;

      const [groups, contacts, leadsResult] = await Promise.all([
        getOpenWAGroups(clientSessionName).catch(() => []),
        getOpenWAContacts(clientSessionName).catch(() => []),
        supabase.from('leads').select('nombre, telefono').not('telefono', 'is', null),
      ]);

      const leadsList = leadsResult.data || [];
      const normalizePhone = (num: string) => num.replace(/[^0-9]/g, '');

      const getContactName = (id: string, currentName?: string) => {
        const cleanName = (currentName || '').trim();
        const isNumericName = cleanName && /^[0-9+()-\s]+$/.test(cleanName);
        if (cleanName && !isNumericName) {
          return cleanName;
        }

        const chatPhone = id.split('@')[0];
        const matchingLead = leadsList.find(lead => {
          const leadPhone = normalizePhone(lead.telefono || '');
          return leadPhone && (chatPhone.endsWith(leadPhone) || leadPhone.endsWith(chatPhone));
        });

        if (matchingLead) {
          return matchingLead.nombre;
        }

        return cleanName || chatPhone;
      };

      const formattedGroups = (groups || [])
        .filter(g => g.id !== 'status' && !g.id.includes('broadcast'))
        .map(g => ({
          id: g.id,
          name: g.name || 'Grupo sin nombre',
          isGroup: true
        }));

      const formattedContacts = (contacts || [])
        .filter(c => c.id !== 'status' && !c.id.includes('broadcast'))
        .map(c => {
          const rawName = c.name || c.pushName || c.number || undefined;
          return {
            id: c.id,
            name: getContactName(c.id, rawName),
            isGroup: false
          };
        });

      setWaChats([...formattedGroups, ...formattedContacts]);
    } catch (err) {
      console.warn("Could not fetch WA chats:", err);
    } finally {
      setLoadingWaChats(false);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    const { data } = await supabase
      .from('leads')
      .select('id_lead, nombre, telefono')
      .not('telefono', 'is', null)
      .order('nombre');
    if (data) setLeads(data);
    setLoadingLeads(false);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetPhone = '';
    if (shareMode === 'select') {
      if (!selectedLeadId) return setError('Por favor, selecciona un destinatario (Lead o Grupo).');
      const lead = leads.find(l => l.id_lead === selectedLeadId);
      if (!lead) return setError('Destinatario no encontrado.');
      targetPhone = lead.telefono;
    } else {
      if (!manualPhone.trim()) return setError('Por favor, ingresa el número o ID de grupo manualmente.');
      targetPhone = manualPhone.trim();
    }

    setSending(true);
    setError('');
    setSuccess(false);

    const clientSessionName = profile?.id_usuario 
      ? (localStorage.getItem(`client_whatsapp_session_${profile.id_usuario}`) || undefined)
      : undefined;

    try {
      if (publication.imagen_url) {
        const imgUrl = publication.imagen_url;
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64data = reader.result as string;
              await sendWhatsAppImageMessage(
                targetPhone, 
                base64data, 
                publication.contenido || undefined,
                clientSessionName
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (e) => reject(e);
        });
      } else {
        await sendWhatsAppTextMessage(targetPhone, publication.contenido || '', clientSessionName);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al compartir la publicación por WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Compartir por WhatsApp</h3>
              <p className="text-[10px] text-slate-400 font-medium">Publicación: {publication.titulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleShare} className="p-5 space-y-4">
          {error && <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}
          {success && <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">¡Publicación compartida con éxito!</div>}

          {/* Modo de envío */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setShareMode('select')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                shareMode === 'select'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Seleccionar Lead/Grupo
            </button>
            <button
              type="button"
              onClick={() => setShareMode('manual')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                shareMode === 'manual' && manualPhone !== 'status@broadcast'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ingresar Número Manual
            </button>
            <button
              type="button"
              onClick={() => { setShareMode('manual'); setManualPhone('status@broadcast'); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                shareMode === 'manual' && manualPhone === 'status@broadcast'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mi Estatus
            </button>
          </div>

          {shareMode === 'select' ? (
            <div>
              <label className={labelCls}>Destinatario (Lead o Grupo)</label>
              {loadingLeads ? (
                <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando destinatarios...</div>
              ) : (
                <select required value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar Lead o Grupo...</option>
                  {leads.map(l => (
                    <option key={l.id_lead} value={l.id_lead}>{l.nombre} ({l.telefono})</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="relative">
              <label className={labelCls}>Número de Teléfono o ID de Grupo</label>
              <input
                type="text"
                required
                value={manualPhone}
                onChange={e => {
                  setManualPhone(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Busca por nombre de grupo/contacto o escribe el número..."
                className={inputCls}
              />
              {loadingWaChats && (
                <div className="absolute right-3 top-8 text-[10px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Cargando chats...
                </div>
              )}
              {showSuggestions && manualPhone.trim() && waChats.filter(chat => 
                chat.name.toLowerCase().includes(manualPhone.toLowerCase()) || 
                chat.id.toLowerCase().includes(manualPhone.toLowerCase())
              ).length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {waChats.filter(chat => 
                    chat.name.toLowerCase().includes(manualPhone.toLowerCase()) || 
                    chat.id.toLowerCase().includes(manualPhone.toLowerCase())
                  ).slice(0, 5).map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        setManualPhone(chat.id);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors text-xs font-semibold flex items-center justify-between"
                    >
                      <span className="truncate flex items-center gap-1.5 text-slate-700">
                        {chat.isGroup ? '👥' : '👤'} {chat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{chat.id.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[9px] text-slate-400 mt-1">
                Escribe las primeras letras para buscar grupos/contactos de tu WhatsApp, o introduce el número/ID directamente.
              </p>
            </div>
          )}

          <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vista previa de WhatsApp</p>
            {publication.imagen_url && (
              <div className="h-28 rounded-lg overflow-hidden border border-slate-100 bg-white">
                <img src={publication.imagen_url} alt="Media preview" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs font-medium text-slate-700 whitespace-pre-line line-clamp-4">{publication.contenido}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 -mx-5 -mb-5 p-5 bg-slate-50/30">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={sending || success} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-emerald-100">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{sending ? 'Compartiendo...' : 'Compartir ahora'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
