// src/learning/components/OnboardingFlow.tsx
import { useState } from 'react';

export default function OnboardingFlow({ onProceedToLogin }: { onProceedToLogin: () => void }) {
  const [step, setStep] = useState<'welcome' | 'skip_confirm'>('welcome');

  const handleSkip = () => {
    localStorage.setItem('marketdev_tour_completed', 'true');
    onProceedToLogin();
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[99999]">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Bienvenido a Marketdev!</h2>
          <p className="text-slate-500 mb-6 font-medium">Te mostraremos cómo usarla paso a paso.</p>
          <button onClick={onProceedToLogin} className="bg-violet-600 hover:bg-violet-700 text-white w-full py-3.5 rounded-xl mb-3 font-bold transition-all shadow-md">Comenzar y hacer Login</button>
          <button onClick={() => setStep('skip_confirm')} className="text-slate-500 hover:text-slate-800 font-bold w-full py-2 transition-colors">Omitir recorrido</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[99999]">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <h2 className="text-2xl font-black text-slate-800 mb-2">¿Seguro que deseas omitir?</h2>
        <button onClick={() => setStep('welcome')} className="bg-slate-100 hover:bg-slate-200 text-slate-800 w-full py-3.5 rounded-xl mb-3 font-bold transition-colors">No, prefiero ver el recorrido</button>
        <button onClick={handleSkip} className="border-2 border-violet-600 text-violet-600 hover:bg-violet-50 w-full py-3 rounded-xl font-bold transition-colors">Sí, omitir e ir directo al login</button>
      </div>
    </div>
  );
}
