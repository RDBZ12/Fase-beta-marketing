import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Calendar, Sparkles, UploadCloud, AlertCircle, PlusCircle, Edit2, Share2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Campaign } from '../types';

interface MisPublicacionesModuleProps {
  campaigns: Campaign[];
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MisPublicacionesModule: React.FC<MisPublicacionesModuleProps> = ({ campaigns }) => {
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State with local timezone date and time default
  const getInitialDateTime = () => {
    const nowObj = new Date();
    const localDateInit = new Date(nowObj.getTime() - (nowObj.getTimezoneOffset() * 60000));
    return {
      date: localDateInit.toISOString().split('T')[0],
      time: localDateInit.toISOString().substring(11, 16)
    };
  };

  const initialDateTime = getInitialDateTime();
  const [formData, setFormData] = useState({
    id_campana: '',
    titulo: '',
    contenido: '',
    fecha_publicacion: initialDateTime.date,
    hora_publicacion: initialDateTime.time,
    imagen_url: '',
    imagen_url: '',
    id_red: '',
    isScheduled: true // dummy flag to force recalculation down in render
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [redes, setRedes] = useState<any[]>([]);
  const [replicateTargetPub, setReplicateTargetPub] = useState<any | null>(null);
  const [selectedRedId, setSelectedRedId] = useState<string>('');
  const [isReplicating, setIsReplicating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchRedes = async () => {
      const { data } = await supabase.from('redes_sociales').select('*').eq('estado', 'activo');
      if (data) {
        setRedes(data);
        const ig = data.find(r => r.nombre_red.toLowerCase().includes('insta'));
        if (ig) {
          setFormData(prev => ({ ...prev, id_red: String(ig.id_red) }));
        } else if (data.length > 0) {
          setFormData(prev => ({ ...prev, id_red: String(data[0].id_red) }));
        }
      }
    };
    fetchRedes();
  }, []);

  useEffect(() => {
    fetchPublicaciones();
  }, [campaigns]);

  const fetchPublicaciones = async () => {
    setLoading(true);
    if (campaigns.length === 0) {
      setPublicaciones([]);
      setLoading(false);
      return;
    }
    
    const campaignIds = campaigns.map(c => c.id);
    const { data } = await supabase
      .from('publicaciones')
      .select('*, redes_sociales(nombre_red)')
      .in('id_campana', campaignIds)
      .order('fecha_publicacion', { ascending: false });
      
    if (data) {
      const now = new Date();
      const updatedData = data.map(pub => {
        return {
          ...pub,
          nombre_red: pub.id_red ? ((pub as any).redes_sociales?.nombre_red || 'Instagram') : 'Todas las redes'
        };
      });

      setPublicaciones(updatedData);
    }
    setLoading(false);
  };

  const handleGenerateAI = async () => {
    if (!formData.titulo) {
      showToast("Por favor ingresa un título o tema para que la IA sepa de qué escribir.", 'error');
      return;
    }
    setIsGeneratingAI(true);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `Escribe un ÚNICO texto persuasivo, directo y listo para publicar en Instagram sobre: "${formData.titulo}". 
Añade emojis.
REGLAS ESTRICTAS: 
1. NO me des opciones, ni consejos, ni notas adicionales.
2. NO incluyas encabezados como "Opción 1" o "Tips".
3. Incluye MÁXIMO 5 hashtags al final.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      setFormData(prev => ({ ...prev, contenido: text }));
      showToast("¡Texto generado exitosamente con IA!", 'success');
    } catch (err) {
      showToast("Error al generar texto con IA.", 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!formData.contenido || !formData.fecha_publicacion) {
      showToast("Completa los campos requeridos (Contenido y Fecha).", 'error');
      return;
    }

    const selectedRedObj = redes.find(r => String(r.id_red) === formData.id_red);
    let plat = 'instagram';
    if (selectedRedObj) {
      const nred = selectedRedObj.nombre_red.toLowerCase();
      if (nred.includes('tele')) plat = 'telegram';
      else if (nred.includes('face')) plat = 'facebook';
      else if (nred.includes('twit') || nred.includes('x')) plat = 'twitter';
      else if (nred.includes('link')) plat = 'linkedin';
      else if (nred.includes('tik')) plat = 'tiktok';
      else if (nred.includes('you')) plat = 'youtube';
    }
    const uniquePlats = [plat];

    if (!formData.imagen_url) {
      showToast("Se requiere obligatoriamente una imagen o video para publicar en cualquier red social. Por favor, sube un archivo multimedia.", 'error');
      return;
    }

    let resolvedCampanaId = null;
    if (formData.id_campana) {
      const camp = campaigns.find(c => c.name === formData.id_campana);
      if (camp) {
        resolvedCampanaId = camp.id;
        if (camp.status === 'Pendiente de Pago') {
          showToast("No puedes programar publicaciones en una campaña que aún no ha sido pagada/aprobada.", 'error');
          return;
        }
      }
    }

    const datetime = `${formData.fecha_publicacion}T${formData.hora_publicacion || '12:00'}:00`;
    const selectedDate = new Date(datetime);
    
    const now = new Date();
    now.setSeconds(0, 0); // Permitir el minuto actual exacto

    if (selectedDate < now) {
      showToast("La fecha y hora de publicación no puede ser en el pasado.", 'error');
      return;
    }
    let actionError;
    let finalMediaUrl = formData.imagen_url;

    setIsSaving(true);

    // 1. Subir imagen base64 al bucket de Supabase si es necesario
    if (finalMediaUrl && finalMediaUrl.startsWith('data:image')) {
      try {
        const match = finalMediaUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const contentType = match[1];
          const b64Data = match[2];
          const byteCharacters = atob(b64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          const blob = new Blob(byteArrays, { type: contentType });
          const ext = contentType.split('/')[1] || 'png';
          const fileName = `pub_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          
          await supabase.storage.from('img').upload(fileName, blob, { contentType });
          const { data: publicUrlData } = supabase.storage.from('img').getPublicUrl(fileName);
          finalMediaUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Error al subir imagen:", err);
      }
    }

    // 2. Enviar a Ayrshare (Edge Function) SOLO si es publicación inmediata
    let ayrshareId = null;
    const isoDate = new Date(datetime).toISOString();
    
    const diffMinutes = (new Date(datetime).getTime() - new Date().getTime()) / 60000;
    // Consideramos "Programada" cualquier fecha que esté al menos 1 minuto en el futuro
    const isScheduled = diffMinutes > 1; 
    
    if (!isScheduled) {
      try {
        const { data: ayrData, error: ayrError } = await supabase.functions.invoke('publish_social', {
          body: { 
            post: formData.contenido, 
            platforms: uniquePlats, 
            mediaUrls: finalMediaUrl ? [finalMediaUrl] : [],
          }
        });
        if (!ayrError && ayrData && !ayrData.error) {
          ayrshareId = ayrData.postId || ayrData.data?.id || null;
        } else {
          const errorRaw = ayrError?.message || ayrData?.error || 'Error desconocido';
          console.warn("Ayrshare Edge Function warning:", errorRaw);
          
          let userFriendlyMsg = "Ocurrió un error al intentar publicar en las redes sociales.";
          try {
            const errorText = typeof errorRaw === 'string' ? errorRaw : JSON.stringify(errorRaw);
            if (errorText.toLowerCase().includes('duplicate') || errorText.includes('"code":137')) {
              userFriendlyMsg = "⚠️ Bloqueo por Spam: Ya publicaste este contenido hace poco.";
            } else if (errorText.toLowerCase().includes('unauthorized')) {
              userFriendlyMsg = "No se pudo conectar. Verifica que tus redes estén vinculadas correctamente.";
            } else {
              userFriendlyMsg = typeof errorRaw === 'string' ? errorRaw : "Error en el publicador.";
            }
          } catch(e) { userFriendlyMsg = String(errorRaw); }

          showToast(userFriendlyMsg, 'error');
          setIsSaving(false);
          return;
        }
      } catch (edgeErr: any) {
        console.warn("Error invocando publish_social:", edgeErr);
        showToast("Error al conectar con el publicador de redes: " + edgeErr.message, 'error');
        setIsSaving(false);
        return;
      }
    }

    // 3. Guardar en Base de Datos
    const payload: any = {
      titulo: formData.titulo || 'Post Manual',
      contenido: formData.contenido,
      id_campana: resolvedCampanaId,
      fecha_publicacion: isoDate,
      imagen_url: finalMediaUrl,
      id_red: formData.id_red ? Number(formData.id_red) : null
    };
    if (ayrshareId) payload.ayrshare_post_id = ayrshareId;

    const nuevoEstado = isScheduled ? 'Programada' : 'Publicada';

    if (editingId) {
      payload.estado = nuevoEstado;
      const { error } = await supabase.from('publicaciones').update(payload).eq('id_publicacion', editingId);
      actionError = error;
    } else {
      payload.estado = nuevoEstado;
      const { error } = await supabase.from('publicaciones').insert([payload]);
      actionError = error;
    }

    if (!actionError) {
      showToast(editingId ? "Publicación actualizada exitosamente." : "Publicación programada exitosamente.", 'success');
      setIsCreating(false);
      setEditingId(null);
      fetchPublicaciones();
      const defaultIg = redes.find(r => r.nombre_red.toLowerCase().includes('insta'))?.id_red || (redes[0]?.id_red || '');
      setFormData({ id_campana: '', titulo: '', contenido: '', fecha_publicacion: '', hora_publicacion: '', imagen_url: '', id_red: String(defaultIg) });
    } else {
      showToast("Error al guardar: " + actionError.message, 'error');
    }
    
    setIsSaving(false);
  };

  const handleEditClick = (pub: any, camp: any) => {
    const pubDate = new Date(pub.fecha_publicacion);
    // Para no desajustar el timezone
    const localDate = new Date(pubDate.getTime() - (pubDate.getTimezoneOffset() * 60000));
    setFormData({
      id_campana: camp ? camp.name : '',
      titulo: pub.titulo || '',
      contenido: pub.contenido || '',
      fecha_publicacion: localDate.toISOString().split('T')[0],
      hora_publicacion: localDate.toISOString().substring(11, 16),
      imagen_url: pub.imagen_url || '',
      id_red: pub.id_red ? String(pub.id_red) : ''
    });
    setEditingId(pub.id_publicacion);
    setIsCreating(true);
  };

  const handleReplicateSubmit = async () => {
    if (!selectedRedId || !replicateTargetPub) return;
    setIsReplicating(true);

    const selectedRedObj = redes.find(r => String(r.id_red) === selectedRedId);
    let plat = 'instagram';
    if (selectedRedObj) {
      const nred = selectedRedObj.nombre_red.toLowerCase();
      if (nred.includes('tele')) plat = 'telegram';
      else if (nred.includes('face')) plat = 'facebook';
      else if (nred.includes('twit') || nred.includes('x')) plat = 'twitter';
      else if (nred.includes('link')) plat = 'linkedin';
      else if (nred.includes('tik')) plat = 'tiktok';
      else if (nred.includes('you')) plat = 'youtube';
    }

    let ayrshareId = null;
    try {
      // 1. Invocar la Edge Function para publicar inmediatamente
      const { data: ayrData, error: ayrError } = await supabase.functions.invoke('publish_social', {
        body: { 
          post: replicateTargetPub.contenido, 
          platforms: [plat], 
          mediaUrls: replicateTargetPub.imagen_url ? [replicateTargetPub.imagen_url] : [],
        }
      });

      if (!ayrError && ayrData && !ayrData.error) {
        ayrshareId = ayrData.postId || ayrData.data?.id || null;
      } else {
        const errorRaw = ayrError?.message || ayrData?.error || 'Error desconocido';
        let userFriendlyMsg = "Error al publicar en " + (selectedRedObj?.nombre_red || plat) + ".";
        
        try {
          const errorText = typeof errorRaw === 'string' ? errorRaw : JSON.stringify(errorRaw);
          if (errorText.toLowerCase().includes('duplicate') || errorText.includes('"code":137')) {
            userFriendlyMsg = "⚠️ Bloqueo por Spam: Esta red social ya tiene una publicación idéntica reciente. Cambia el texto para proteger tu cuenta.";
          } else if (errorText.toLowerCase().includes('unauthorized')) {
            userFriendlyMsg = "Cuenta desvinculada. Verifica tu conexión con " + (selectedRedObj?.nombre_red || plat) + ".";
          }
        } catch(e) {}

        showToast(userFriendlyMsg, 'error');
        setIsReplicating(false);
        return;
      }

      // 2. Guardar en Base de Datos
      const payload: any = {
        titulo: replicateTargetPub.titulo || 'Post Manual',
        contenido: replicateTargetPub.contenido,
        id_campana: replicateTargetPub.id_campana,
        fecha_publicacion: new Date().toISOString(),
        imagen_url: replicateTargetPub.imagen_url,
        id_red: Number(selectedRedId),
        estado: 'Publicada',
        ayrshare_post_id: ayrshareId
      };

      const { error } = await supabase.from('publicaciones').insert([payload]);
      if (!error) {
        showToast("Publicación subida a " + (selectedRedObj?.nombre_red || plat) + " exitosamente.", 'success');
        setReplicateTargetPub(null);
        setSelectedRedId('');
        fetchPublicaciones();
      } else {
        showToast("Error al guardar en base de datos: " + error.message, 'error');
      }
    } catch (err: any) {
      showToast("Error de conexión: " + err.message, 'error');
    } finally {
      setIsReplicating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 border ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
            toast.type === 'error' ? 'bg-pink-50 text-pink-900 border-pink-200' :
            'bg-slate-50 text-slate-900 border-slate-200'
          }`}>
            {toast.type === 'success' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Sparkles className="w-4 h-4" /></div>}
            {toast.type === 'error' && <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><AlertCircle className="w-4 h-4" /></div>}
            <p className="font-medium text-sm pr-4">{toast.message}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Publicación' : 'Nueva Publicación'}</h2>
          <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Asociar a Campaña (Opcional)</label>
            <input 
              value={formData.id_campana}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              onChange={e => {
                setFormData({...formData, id_campana: e.target.value});
                setIsDropdownOpen(true);
              }}
              placeholder="Escribe para buscar o selecciona una..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500" 
            />
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {campaigns
                  .filter(c => c.status !== 'Completada')
                  .filter(c => c.name.toLowerCase().includes(formData.id_campana.toLowerCase()))
                  .map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setFormData({...formData, id_campana: c.name});
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        c.status === 'Activa' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                        c.status === 'Borrador' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                        'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                ))}
                {campaigns.filter(c => c.status !== 'Completada' && c.name.toLowerCase().includes(formData.id_campana.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500">No hay coincidencias...</div>
                )}
              </div>
            )}
          </div>



          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tema o Título (Para generar IA)</label>
            <input 
              type="text" 
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ej. Promoción de verano 50% de descuento..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-slate-700">Contenido / Copy</label>
              <button 
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-400 bg-violet-400/10 px-3 py-1.5 rounded-lg hover:bg-violet-400/20 transition-colors disabled:opacity-50">
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingAI ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea 
              rows={5} 
              value={formData.contenido}
              onChange={e => setFormData({...formData, contenido: e.target.value})}
              placeholder="Escribe el texto de tu publicación aquí o usa la IA para generarlo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Red Social *</label>
            <select 
              value={formData.id_red}
              onChange={e => setFormData({...formData, id_red: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500"
              required
            >
              <option value="">Seleccionar Red Social...</option>
              {redes.map(r => (
                <option key={r.id_red} value={r.id_red}>{r.nombre_red}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Publicación</label>
              <input 
                type="date" 
                min={getLocalDateString()}
                value={formData.fecha_publicacion}
                onChange={e => setFormData({...formData, fecha_publicacion: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hora</label>
              <input 
                type="time" 
                value={formData.hora_publicacion}
                onChange={e => setFormData({...formData, hora_publicacion: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 [color-scheme:dark]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Multimedia (Imagen/Video)</label>
            <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
              {formData.imagen_url ? (
                <div className="flex flex-col items-center">
                  <img src={formData.imagen_url} alt="Preview" className="max-h-32 rounded-lg object-contain mb-3" />
                  <p className="text-sm font-medium text-violet-600">Haz clic para cambiar la imagen</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3 group-hover:text-violet-500 transition-colors" />
                  <p className="text-sm font-medium text-slate-700">Haz clic para subir un archivo multimedia</p>
                  <p className="text-xs text-slate-500 mt-1">Soporta JPG, PNG hasta 5MB.</p>
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, imagen_url: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
             <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="px-6 py-2.5 rounded-xl font-medium text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
             <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className={`px-8 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-violet-500'}`}>
               {isSaving ? 'Procesando...' : (
                 editingId 
                   ? 'Actualizar Publicación' 
                   : (new Date(`${formData.fecha_publicacion}T${formData.hora_publicacion || '12:00'}:00`).getTime() - new Date().getTime()) / 60000 <= 1 
                     ? 'Publicar Ahora' 
                     : 'Programar Publicación'
               )}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 border ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
          toast.type === 'error' ? 'bg-pink-50 text-pink-900 border-pink-200' :
          'bg-slate-50 text-slate-900 border-slate-200'
        }`}>
          {toast.type === 'success' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Sparkles className="w-4 h-4" /></div>}
          {toast.type === 'error' && <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><AlertCircle className="w-4 h-4" /></div>}
          <p className="font-medium text-sm pr-4">{toast.message}</p>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Historial de Publicaciones</h2>
          <p className="text-slate-500">Revisa todas tus publicaciones pasadas y futuras.</p>
        </div>
        <button 
          onClick={() => {
            const nowObj = new Date();
            const localDateInit = new Date(nowObj.getTime() - (nowObj.getTimezoneOffset() * 60000));
            const defaultIg = redes.find(r => r.nombre_red.toLowerCase().includes('insta'))?.id_red || (redes[0]?.id_red || '');
            setFormData({
              id_campana: '',
              titulo: '',
              contenido: '',
              fecha_publicacion: localDateInit.toISOString().split('T')[0],
              hora_publicacion: localDateInit.toISOString().substring(11, 16),
              imagen_url: '',
              id_red: String(defaultIg)
            });
            setEditingId(null);
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Publicación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-slate-500">Cargando publicaciones...</div>
          ) : publicaciones.length === 0 ? (
             <div className="col-span-full py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
               <ImageIcon className="w-12 h-12 text-[#2a2a4a] mx-auto mb-3" />
               <h3 className="text-lg font-semibold text-slate-700">Aún no tienes publicaciones</h3>
               <p className="text-slate-500 text-sm mt-1 mb-6">Crea tu primera publicación manualmente.</p>
             </div>
          ) : (
            publicaciones.map((pub) => {
              const camp = campaigns.find(c => c.id === pub.id_campana);
              return (
                <div key={pub.id_publicacion} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all flex flex-col">
                  <div className="aspect-video bg-slate-50 relative flex items-center justify-center">
                    {pub.imagen_url || camp?.image_url ? (
                       <img src={pub.imagen_url || camp?.image_url} alt="Post" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                       <ImageIcon className="w-10 h-10 text-[#2a2a4a]" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {(pub.estado === 'Programada' || pub.estado === 'Borrador') && (
                        <button 
                          onClick={() => handleEditClick(pub, camp)}
                          className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-md text-slate-600 hover:text-violet-600 transition-colors shadow-sm flex items-center gap-1 group/edit"
                          title="Editar publicación"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider max-w-0 overflow-hidden group-hover/edit:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">Editar</span>
                        </button>
                      )}
                      <button 
                        onClick={() => { setReplicateTargetPub(pub); setSelectedRedId(''); }}
                        className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-md text-slate-600 hover:text-violet-600 transition-colors shadow-sm flex items-center gap-1 group/replicate"
                        title="Subir a otra red social"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider max-w-0 overflow-hidden group-hover/replicate:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">Subir a otra red</span>
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] font-bold text-slate-900">
                        {new Date(pub.fecha_publicacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                      {camp?.name || 'Sin Campaña'}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">{pub.titulo}</h4>
                    <p className="text-xs text-slate-700 line-clamp-3 mb-4 whitespace-pre-wrap flex-1">
                      {pub.contenido}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200">
                      <span className="text-xs font-semibold text-slate-500">{pub.nombre_red || 'Instagram'}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        pub.estado === 'Publicada' ? 'text-emerald-400 bg-emerald-400/10' :
                        pub.estado === 'Fallida' ? 'text-pink-400 bg-pink-400/10' :
                        'text-amber-400 bg-amber-400/10'
                      }`}>
                        <AlertCircle className="w-3 h-3" /> {pub.estado}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      {/* Modal para publicar en otra red social */}
      {replicateTargetPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-slate-900 mb-2 shrink-0">Subir a otra red social</h3>
            <p className="text-sm text-slate-500 mb-4 shrink-0">
              Esta publicación se copiará con el mismo contenido e imagen. Selecciona la red social de destino:
            </p>

            <div className="space-y-3 mb-6 overflow-y-auto flex-1 pr-2">
              {redes
                .filter(r => String(r.id_red) !== String(replicateTargetPub.id_red))
                .map(r => (
                  <label 
                    key={r.id_red} 
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedRedId === String(r.id_red) 
                        ? 'border-violet-500 bg-violet-50/50 shadow-md ring-1 ring-violet-500' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="replicate-network" 
                      value={r.id_red}
                      checked={selectedRedId === String(r.id_red)}
                      onChange={e => setSelectedRedId(e.target.value)}
                      className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block text-sm">{r.nombre_red}</span>
                    </div>
                  </label>
              ))}
              {redes.filter(r => String(r.id_red) !== String(replicateTargetPub.id_red)).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay otras redes sociales activas disponibles.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
              <button 
                onClick={() => { setReplicateTargetPub(null); setSelectedRedId(''); }}
                disabled={isReplicating}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReplicateSubmit}
                disabled={isReplicating || !selectedRedId}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isReplicating ? 'Publicando...' : 'Publicar Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
