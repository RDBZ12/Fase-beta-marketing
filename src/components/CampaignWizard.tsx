import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, Edit3, ArrowLeft, X, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';


interface CampaignWizardProps {
  onCancel: () => void;
  onFinish: () => void;
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ onCancel, onFinish }) => {
  const [step, setStep] = useState(1);
  const [, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    budget: '',
    description: '',
    audience: '',
    objective: '',
    objective: '',
    startDate: getLocalDateString(),
    endDate: '',
    scheduledTime: '',
    socialNetwork: 'instagram'
  });

  const [aiResults, setAiResults] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerateSingleImage = () => {
    if (!formData.businessName || !formData.description) {
      alert("Por favor ingresa al menos el Nombre y Descripción del negocio para generar una imagen.");
      return;
    }
    
    setIsGeneratingImage(true);
    const prompt = `Professional marketing photography for a business named ${formData.businessName}. Description: ${formData.description}. High quality, realistic, modern advertisement style, eye-catching`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    
    // Simulate loading so the user knows it's doing something
    setTimeout(() => {
      setSelectedImages(prev => [...prev, imageUrl]);
      setIsGeneratingImage(false);
    }, 1500);
  };

  const handleGenerateAI = async () => {
    if (!formData.businessName || !formData.budget || !formData.description) {
      setErrorMsg('Por favor completa los campos principales (Nombre, Presupuesto, Descripción).');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setErrorMsg('Por favor define la fecha de inicio y la fecha de fin de la campaña.');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setErrorMsg('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    
    setErrorMsg('');
    setIsGenerating(true);
    setStep(2);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('No se encontró la VITE_GEMINI_API_KEY');

      const systemContext = `Eres un experto director de marketing.
Genera una estrategia de campaña. Devuelve la respuesta en formato JSON estricto con esta estructura:
{
  "copys": ["Texto atractivo para un post de Instagram"],
  "calendar": [{"date": "Fecha propuesta", "content": "Tema general"}],
  "hashtags": "#Estrategia #Marketing",
  "segmentation": "Descripción del público objetivo",
  "image_prompts": ["Detailed prompt in english for a marketing image"]
}
IMPORTANTE: El array 'copys' debe tener EXACTAMENTE 1 solo texto directo y único para publicar en Instagram. NO incluyas opciones. MÁXIMO 5 hashtags.`;

      const userPrompt = `Negocio: ${formData.businessName}
Presupuesto: $${formData.budget}
Descripción: ${formData.description}
Audiencia: ${formData.audience}
Objetivo: ${formData.objective}

Genera la estrategia de marketing completa y estructurada como JSON. Asegúrate de que el formato JSON sea válido.`;

      let response;
      let retries = 3;
      while (retries > 0) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemContext + '\n\n' + userPrompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: 'application/json' },
            }),
          }
        );
        if (response.ok) break;
        if (response.status === 503 || response.status === 429) {
          retries--;
          if (retries === 0) throw new Error(`El servidor de Inteligencia Artificial está saturado o alcanzaste el límite de peticiones (Error ${response.status}). Por favor, espera un minuto e intenta de nuevo.`);
          await new Promise(res => setTimeout(res, 3000)); // Esperar 3 segundos antes de reintentar
        } else {
          throw new Error(`Error API Gemini: ${response.status}`);
        }
      }

      const data = await response!.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setAiResults(parsed);
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrorMsg(`Error: ${err instanceof Error ? err.message : 'Desconocido'}`);
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    // 1. Guardar la campaña
    try {
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id;

      const dbData = {
        nombre_campana: formData.businessName + ' - IA',
        brand: formData.businessName,
        descripcion: formData.description,
        presupuesto: Number(formData.budget),
        objetivo: formData.objective,
        channel: 'Multi',
        estado: 'Borrador',
        id_usuario: userId,
        leads: 0,
        ctr: 0,
        reach: '0',
        start_date: formData.startDate,
        fecha_inicio: formData.startDate,
        fecha_fin: formData.endDate
      };

      const { data: newCamp, error } = await supabase.from('campaigns').insert([dbData]).select().single();
      if (error) throw error;

      // Guardar LA única publicación generada
      if (aiResults?.copys && aiResults.copys.length > 0) {
        // Tomamos solo la primera para evitar agotar las cuotas de redes sociales/Ayrshare
        let pubDateStr = formData.startDate;
        if (formData.scheduledTime) {
          pubDateStr += `T${formData.scheduledTime}:00`;
        } else {
          pubDateStr += `T12:00:00`; // Hora por defecto
        }

        const singlePub = {
          titulo: `Post Generado AI - ${formData.socialNetwork}`,
          contenido: aiResults.copys[0] + '\n\n' + (aiResults.hashtags || ''),
          estado: 'Borrador', 
          id_campana: newCamp.id,
          fecha_publicacion: new Date(pubDateStr).toISOString(),
          imagen_url: (aiResults.image_prompts && aiResults.image_prompts[0]) 
            ? `https://image.pollinations.ai/prompt/${encodeURIComponent(aiResults.image_prompts[0])}?width=800&height=800&nologo=true`
            : (selectedImages[0] || null)
        };
        const { error: pubError } = await supabase.from('publicaciones').insert([singlePub]);
        if (pubError) console.error("Error al guardar publicación:", pubError);
      }

      console.log("Campaña guardada:", newCamp);
      
      setStep(4);
    } catch (err) {
      console.error("Error al guardar campaña:", err);
      alert(`No se pudo guardar la campaña. Error: ${(err as any).message || JSON.stringify(err)}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500 text-slate-800">
      
      {/* STEPS HEADER */}
      <div className="mb-10 flex items-center justify-center">
        {[
          { num: 1, label: 'Datos' },
          { num: 2, label: 'Análisis IA' },
          { num: 3, label: 'Revisión' },
          { num: 4, label: 'Pago' }
        ].map((s, idx, arr) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                step >= s.num 
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' 
                  : 'bg-[#2a2a4a] text-slate-500'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-violet-300' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className={`w-16 md:w-32 h-1 rounded-full mx-2 -mt-6 transition-colors duration-300 ${
                step > s.num ? 'bg-violet-600/50' : 'bg-[#2a2a4a]'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: BUSINESS INFO */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-violet-600/20 blur-[60px] rounded-full" />
          <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-indigo-600/20 blur-[60px] rounded-full" />

          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Detalles del Negocio</h3>
            {errorMsg && (
              <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-4 py-3 rounded-xl text-sm font-medium">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nombre del Negocio</label>
                <input 
                  type="text" 
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="Ej. Nova Innovations" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Presupuesto ($USD)</label>
                <input 
                  type="number"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="15000" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Descripción del Negocio</label>
              <textarea 
                rows={3} 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none" placeholder="Describe brevemente a qué te dedicas y qué valor aportas..."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Público Objetivo</label>
                <select 
                  value={formData.audience}
                  onChange={e => setFormData({...formData, audience: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none">
                  <option value="">Selecciona tu audiencia ideal</option>
                  <option value="profesionales">Profesionales 25-45 años</option>
                  <option value="jovenes">Jóvenes Universitarios</option>
                  <option value="empresas">B2B (Otras Empresas)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Objetivo Principal</label>
                <select 
                  value={formData.objective}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none">
                  <option value="">¿Qué deseas lograr?</option>
                  <option value="awareness">Reconocimiento de Marca</option>
                  <option value="leads">Generación de Leads</option>
                  <option value="sales">Ventas Directas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Fecha de Inicio</label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  min={getLocalDateString()}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Fecha de Fin</label>
                <input 
                  type="date" 
                  value={formData.endDate}
                  min={formData.startDate || getLocalDateString()}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Red Social (Destino)</label>
                <select 
                  value={formData.socialNetwork}
                  onChange={e => setFormData({...formData, socialNetwork: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none">
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Hora Programada (Opcional)</label>
                <input 
                  type="time" 
                  value={formData.scheduledTime}
                  onChange={e => setFormData({...formData, scheduledTime: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Imágenes de la Campaña</label>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors border border-slate-200">
                    <span>Subir imágenes</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  
                  <button 
                    type="button" 
                    onClick={handleGenerateSingleImage}
                    disabled={isGeneratingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl transition-colors border border-violet-200 font-medium"
                  >
                    {isGeneratingImage ? <span className="animate-pulse">Generando...</span> : <> <BrainCircuit className="w-4 h-4"/> <span>Generar con IA ahora</span> </>}
                  </button>
                </div>

                {selectedImages.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {selectedImages.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} alt="Upload preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
                        <button 
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Eliminar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {src.includes('pollinations') && (
                          <a 
                            href={src} 
                            target="_blank" 
                            rel="noreferrer"
                            download={`campana_ia_${idx}.jpg`}
                            className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Descargar Imagen"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">Si generas imágenes aquí, podrás revisarlas antes de lanzar la campaña.</p>
            </div>

            <div className="pt-6 flex justify-end gap-4 border-t border-slate-200 mt-6">
              <button onClick={onCancel} className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
              <button 
                onClick={handleGenerateAI}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
              >
                <BrainCircuit className="w-5 h-5" />
                Generar Estrategia con IA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: AI GENERATING (LOADING) */}
      {step === 2 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600 rounded-full blur-[60px] opacity-40 animate-pulse" />
            <BrainCircuit className="w-32 h-32 text-violet-400 animate-pulse relative z-10" />
          </div>
          <h2 className="text-2xl font-bold mt-8 text-slate-900">La Inteligencia Artificial está trabajando...</h2>
          <p className="text-slate-500 mt-2">Analizando mercado, redactando copys y diseñando estrategia.</p>
          <div className="w-64 h-2 bg-white rounded-full mt-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW AI RESULTS */}
      {step === 3 && aiResults && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 flex items-center gap-3">
            <BrainCircuit className="text-violet-400 w-7 h-7" />
            Resultados de la IA
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Estrategia */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">
                <button className="absolute top-3 right-3 text-slate-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-4 h-4" /></button>
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Estrategia Resumida</h4>
                <p className="text-slate-800 text-sm leading-relaxed">{aiResults.strategy}</p>
              </div>

              {/* Segmentación */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">
                <button className="absolute top-3 right-3 text-slate-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-4 h-4" /></button>
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Segmentación Recomendada</h4>
                <p className="text-slate-800 text-sm">{aiResults.segmentation}</p>
              </div>

              {/* Hashtags */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">
                <button className="absolute top-3 right-3 text-slate-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-4 h-4" /></button>
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Hashtags</h4>
                <p className="text-violet-400 font-semibold text-sm">{aiResults.hashtags}</p>
              </div>
            </div>

            <div className="space-y-6">
               {/* Copys */}
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Texto Publicitario (Copy)</h4>
                <div className="space-y-3">
                  {aiResults.copys.slice(0, 1).map((copy: string, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 relative group/copy">
                      <button className="absolute top-2 right-2 text-slate-500 hover:text-violet-600 opacity-0 group-hover/copy:opacity-100"><Edit3 className="w-3.5 h-3.5" /></button>
                      <div className="mb-3">
                        {aiResults.image_prompts && aiResults.image_prompts[i] ? (
                          <img 
                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(aiResults.image_prompts[i])}?width=800&height=800&nologo=true`} 
                            alt={`Generated AI image`} 
                            className="w-full h-48 object-cover rounded-lg border border-slate-100"
                          />
                        ) : selectedImages.length > 0 ? (
                           <img src={selectedImages[0]} alt="User upload" className="w-full h-48 object-cover rounded-lg border border-slate-100" />
                        ) : null}
                      </div>
                      <p className="whitespace-pre-wrap">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendario */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Calendario Preliminar</h4>
                <div className="space-y-2">
                   {aiResults.calendar.map((cal: any, i: number) => (
                     <div key={i} className="flex gap-3 items-center text-sm">
                       <span className="bg-violet-600/20 text-violet-400 px-2 py-1 rounded font-bold text-xs shrink-0">{cal.date}</span>
                       <span className="text-slate-700 truncate">{cal.content}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-between items-center border-t border-slate-200 mt-8">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Editar Formulario
            </button>
            <button 
              onClick={handleApprove}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              <CheckCircle2 className="w-5 h-5" />
              Aprobar y Proceder al Pago
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {step === 4 && (
         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center max-w-lg mx-auto py-12 animate-in zoom-in-95">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Campaña Creada Exitosamente</h2>
            <p className="text-slate-500 mb-8">
              Tu campaña está guardada en estado <strong>Pendiente de Pago</strong>.
              Ve a "Mis Campañas" para pagar el presupuesto de <strong className="text-emerald-600">${formData.budget || '1,500'}</strong> mediante PayPal y activarla.
            </p>
            
            <button 
              onClick={onFinish}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            >
              Ir a Mis Campañas
            </button>
         </div>
      )}

    </div>
  );
};
