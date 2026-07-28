// src/learning/components/LearningChat.tsx
import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useLearning } from '../context/LearningContext';
import { findIntent } from '../data/knowledge';
import { LearningDispatcher } from '../services/LearningDispatcher';

export default function LearningChat() {
  const { isChatOpen, flowState, resumeFlow } = useLearning();
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user', text: string }[]>([
    { sender: 'bot', text: '¡Hola! Soy tu Instructor de Marketdev. ¿Qué quieres aprender a hacer hoy?' }
  ]);
  const [input, setInput] = useState('');

  if (!isChatOpen) return null;

  const processMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    const intent = findIntent(text);
    setInput('');

    setTimeout(() => {
      if (intent) {
        // Pick a random response from the explanation array to make it dynamic
        const randomExplanation = Array.isArray(intent.explanation) 
          ? intent.explanation[Math.floor(Math.random() * intent.explanation.length)]
          : intent.explanation;
          
        setMessages(prev => [...prev, { sender: 'bot', text: randomExplanation }]);
        if (intent.triggerFlow) {
          setTimeout(() => {
            const isPdfIntent = ['pdf', 'comprobante', 'qr', 'ncf'].some(kw => text.toLowerCase().includes(kw));
            if (isPdfIntent) {
              sessionStorage.setItem('learning_sub_intent', 'pdf');
            } else {
              sessionStorage.removeItem('learning_sub_intent');
            }
            LearningDispatcher.dispatch('START_FLOW', intent.triggerFlow);
          }, 1500);
        }
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Hmm, no estoy completamente seguro de a qué te refieres 🤔. Pero soy experto en ayudarte a crear campañas, revisar tus pagos o ver tus estadísticas. ¿Te gustaría intentar con alguna de esas opciones?' }]);
      }
    }, 600);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processMessage(input);
  };

  return (
    <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9998] overflow-hidden">

      {/* HEADER DE CHAT */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
        <h3 className="font-bold flex items-center gap-2"><Sparkles size={18} /> Asistente Marketdev</h3>
      </div>

      {/* BANNER DE REANUDACIÓN DE TOURS */}
      {flowState === 'PAUSED' && (
        <div className="bg-amber-100 p-3 flex justify-between items-center border-b border-amber-200">
          <span className="text-xs text-amber-800 font-bold">Tienes una lección pausada.</span>
          <button onClick={resumeFlow} className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1 rounded-full shadow-sm transition-colors">Retomar Tour</button>
        </div>
      )}

      {/* BURBUJAS DE CHAT */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.sender === 'user' ? 'bg-violet-600 text-white self-end rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 self-start rounded-bl-sm'}`}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* SUGERENCIAS RÁPIDAS (Solo al inicio) */}
      {messages.length === 1 && (
        <div className="px-3 pb-3 bg-slate-50 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide border-t border-slate-100 pt-3">
          <button onClick={() => processMessage('Quiero crear una campaña')} className="text-xs font-medium bg-white hover:bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full transition-colors border border-violet-200 shadow-sm">
            🚀 Crear campaña
          </button>
          <button onClick={() => processMessage('Ver mis métricas')} className="text-xs font-medium bg-white hover:bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full transition-colors border border-violet-200 shadow-sm">
            📊 Ver estadísticas
          </button>
          <button onClick={() => processMessage('¿Cómo pago mis facturas?')} className="text-xs font-medium bg-white hover:bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full transition-colors border border-violet-200 shadow-sm">
            💳 Pagar facturas
          </button>
        </div>
      )}

      {/* ÁREA DE TEXTO */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ej: quiero crear una campaña..."
          className="flex-1 bg-slate-100 rounded-full px-4 text-sm outline-none focus:ring-2 focus:ring-violet-300 transition-all"
        />
        <button type="submit" className="bg-violet-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors shadow-md">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
