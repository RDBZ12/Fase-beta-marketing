import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';

interface Message { role: 'user' | 'bot'; text: string; }

export const ChatbotWidget: React.FC = () => {
  const { profile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente de Marketdev 🤖 ¿En qué puedo ayudarte?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const historial = messages
    .slice(1) // skip greeting
    .reduce<Array<{ pregunta: string; respuesta: string }>>((acc, m, i, arr) => {
      if (m.role === 'user' && arr[i + 1]?.role === 'bot') {
        acc.push({ pregunta: m.text, respuesta: arr[i + 1].text });
      }
      return acc;
    }, []);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY_MISSING');

      // Fetch active campaigns for context directly from frontend
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('nombre_campana, estado, channel, leads')
        .eq('estado', 'Activa')
        .limit(5);

      const campañasCtx = campaigns?.length
        ? `Campañas activas: ${campaigns.map((c: { nombre_campana: string }) => c.nombre_campana).join(', ')}.`
        : 'Sin campañas activas en este momento.';

      const systemPrompt = `Eres el asistente virtual de Marketdev, una plataforma de marketing con IA para el sector tabaquero en República Dominicana.
Eres amable, profesional y conciso. Responde siempre en español.
Contexto del negocio: ${campañasCtx}
Si no sabes algo, ofrece derivar al equipo de marketing.`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '¡Hola! Soy el asistente de Marketdev. ¿En qué puedo ayudarte hoy?' }] },
        ...historial.slice(-5).flatMap(h => [
          { role: 'user', parts: [{ text: h.pregunta }] },
          { role: 'model', parts: [{ text: h.respuesta }] },
        ]),
        { role: 'user', parts: [{ text: q }] },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }),
        }
      );

      if (!response.ok) throw new Error(`Gemini error ${response.status}`);
      const data = await response.json();
      const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sin respuesta.';

      // Save to chatbot_historial
      if (profile?.id_usuario) {
        supabase.from('chatbot_historial').insert([{ pregunta: q, respuesta, id_usuario: profile.id_usuario }]).then();
      }

      setMessages(prev => [...prev, { role: 'bot', text: respuesta }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Chatbot Error:', errorMsg);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: errorMsg.includes('VITE_GEMINI_API_KEY_MISSING')
          ? '⚠️ El chatbot no está configurado aún. Agrega VITE_GEMINI_API_KEY en tu archivo .env y REINICIA el servidor (npm run dev).'
          : `⚠️ Error de conexión: ${errorMsg}`
      }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-violet-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Abrir chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Asistente Marketdev</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[10px] text-white/70">En línea · Powered by Gemini AI</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                }`}>
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu consulta..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-40 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
