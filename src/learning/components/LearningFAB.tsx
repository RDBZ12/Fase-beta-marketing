// src/learning/components/LearningFAB.tsx
import { MessageCircle, X } from 'lucide-react';
import { useLearning } from '../context/LearningContext';

export default function LearningFAB() {
  const { isChatOpen, toggleChat } = useLearning();

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 transition-colors z-[9999]"
      aria-label="Abrir Asistente Marketdev"
    >
      {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
    </button>
  );
}
