import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Loader2, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useUser();
  const [topic, setTopic]           = useState('');
  const [channel, setChannel]       = useState('Email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');
  const [saved, setSaved]           = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return setError('Por favor, ingresa un tema o producto.');
    setIsGenerating(true); setGeneratedText(''); setError(''); setCopied(false); setSaved(false);

    try {


      const systemContext = `Eres un experto en marketing digital para el sector tabaquero dominicano.
Genera contenido publicitario profesional, atractivo y adaptado al canal especificado.
Empresa: Marketdev - Sistema de Marketing con IA.
Idioma: Español dominicano (formal).`;

      const userPrompt = `Genera contenido publicitario para ${channel ?? 'redes sociales'} sobre: ${topic ?? 'producto tabaquero premium'}.
Incluye:
- Mensaje principal impactante
- Llamada a la acción
- Hashtags relevantes (si es para redes sociales)
Tono: profesional y persuasivo.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: systemContext + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('La respuesta de la IA no es válida.');
      }
      
      const fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No se pudo generar contenido.';
      // Animate text appearance
      let i = 0;
      const interval = setInterval(() => {
        i += 4;
        setGeneratedText(fullText.substring(0, i));
        if (i >= fullText.length) { clearInterval(interval); setIsGenerating(false); }
      }, 15);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg.includes('VITE_GEMINI_API_KEY_MISSING')
        ? '⚠️ No se encontró la API Key en el archivo .env. Asegúrate de tener VITE_GEMINI_API_KEY configurado.'
        : `Error al generar: ${errorMsg || 'Inténtalo de nuevo.'}`
      );
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!generatedText) return;
    try {
      // Save prompt
      const { data: promptData } = await supabase
        .from('prompts_ia')
        .insert([{ modo: 'generador', prompt: `Canal: ${channel}. Tema: ${topic}`, tipo: channel }])
        .select('id_prompt')
        .single();
      // Save content
      await supabase.from('contenido_ia').insert([{
        id_prompt:   promptData?.id_prompt ?? null,
        respuesta_ia: generatedText,
        canal: channel,
        tema: topic,
        id_usuario: profile?.id_usuario ?? null,
      }]);
      setSaved(true);
    } catch {
      // Silently fail save — content generation already worked
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-violet-700/20" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Generador de Contenido IA</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tema, Producto o Servicio
              </label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="Ej. cigarro premium, campaña de verano..."
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Canal</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                <option value="Email">Email</option>
                <option value="Social">Social</option>
                <option value="Display">Display</option>
                <option value="Multi">Multi</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? 'Generando con Gemini AI...' : 'Generar Contenido Publicitario'}</span>
          </button>

          {(generatedText || isGenerating) && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resultado IA</span>
                {generatedText && !isGenerating && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={saved}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-600 transition-colors disabled:text-emerald-500">
                      <Save className="w-3.5 h-3.5" />
                      <span>{saved ? '¡Guardado!' : 'Guardar'}</span>
                    </button>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors">
                      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">¡Copiado!</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copiar</span></>}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-700 whitespace-pre-wrap min-h-[120px] relative overflow-hidden">
                {generatedText}
                {isGenerating && <span className="inline-block w-1.5 h-4 bg-violet-600 ml-1 animate-pulse" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
