import React, { useState } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('Email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!topic.trim()) return alert('Por favor, ingresa un tema o producto.');
    setIsGenerating(true);
    setGeneratedText('');
    setCopied(false);

    // Simulated content generation
    const copies: Record<string, string[]> = {
      Email: [
        `Asunto: 🚀 Duplica tus leads en 30 días con Marketflow\n\nHola,\n\n¿Estás cansado de campañas que no rinden? Con nuestra tecnología de predicción de alcance y optimización multicanal, podrás automatizar y escalar tu captación de leads de manera inteligente.\n\nPrueba gratis hoy mismo.`,
        `Asunto: ¿Estás perdiendo conversiones? 📉\n\nHola,\n\nTu tasa de conversión actual podría estar un 4.7% por debajo del potencial de tu mercado. Analiza tu embudo de ventas en tiempo real con Marketflow y recupera el ROI de tus campañas.\n\nDescubre cómo aquí.`,
      ],
      Social: [
        `🔥 ¡Olvídate de las conjeturas en marketing! Con Marketflow optimizas tu ROI en tiempo real. Mira cómo alcanzamos +39% en alcance con analítica predictiva. Link en bio. #GrowthMarketing #AdTech #DataDriven`,
        `💡 ¿Sabías que el 87% de las conversiones en redes sociales provienen de interacciones multi-táctiles? Diseña campañas inteligentes con IA integrada en Marketflow. 📲 #AI #SaaS #Martech`,
      ],
      Display: [
        `banner_header: Maximiza tu Presencia Digital\n\nsubtext: Aumenta tu alcance hasta un 39% de forma garantizada y visualiza el ROI de tus anuncios en tiempo real. Pruébalo ya.`,
        `banner_header: Campañas Inteligentes con IA\n\nsubtext: Transforma impresiones en leads calificados utilizando nuestro optimizador de campañas automáticas.`,
      ],
      Multi: [
        `Campañas Omnicanal Simplificadas\n\nLlega a tus prospectos por Email, Redes Sociales y Display de manera coherente y automatizada. Obtén una vista única de rendimiento y atribución con Marketflow.`,
      ],
    };

    let textArray = copies[channel] || copies['Email'];
    let randomIndex = Math.floor(Math.random() * textArray.length);
    let fullText = textArray[randomIndex];

    let currentLength = 0;
    const interval = setInterval(() => {
      if (currentLength < fullText.length) {
        setGeneratedText(fullText.substring(0, currentLength + 3));
        currentLength += 3;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 25);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-violet-700/20" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Generador de Contenido IA
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tema, Producto o Servicio
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej. Software de analítica, tenis deportivos, etc."
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Canal
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              >
                <option value="Email">Email</option>
                <option value="Social">Social</option>
                <option value="Display">Display</option>
                <option value="Multi">Multi</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isGenerating ? 'Generando Copys...' : 'Generar Contenido Publicitario'}</span>
          </button>

          {/* Result Area */}
          {(generatedText || isGenerating) && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Resultado de la IA
                </span>
                {generatedText && !isGenerating && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar al portapapeles</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-700 font-mono whitespace-pre-wrap min-h-[120px] relative overflow-hidden">
                {generatedText}
                {isGenerating && (
                  <span className="inline-block w-1.5 h-4 bg-violet-600 ml-1 animate-pulse"></span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
