// src/learning/components/tour/LearningTooltip.tsx
import type { TooltipRenderProps } from 'react-joyride';
import { Bot } from 'lucide-react';

export default function LearningTooltip({ index, step, backProps, primaryProps, isLastStep, tooltipProps }: TooltipRenderProps) {
  const { actionCompleted, requiresAction, content, helpText } = step as any;

  return (
    <div {...tooltipProps} className="bg-white rounded-xl shadow-2xl p-0 overflow-hidden w-80 font-sans border border-slate-100">
      <div className="bg-violet-600 text-white p-3 flex items-center gap-2">
        <Bot size={18} />
        <span className="font-bold text-sm">Instructor Marketdev</span>
      </div>

      <div className="p-4">
        <p className="text-slate-800 text-[15px] font-medium leading-relaxed">{content as string}</p>

        {helpText && (
          <div className="mt-3 bg-violet-50 p-3 rounded-lg border border-violet-100">
            <p className="text-sm text-violet-800">{helpText}</p>
          </div>
        )}
        <div className="mt-5 flex justify-between items-center h-10">
          {index > 0 ? (
            <button {...backProps} className="text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors">Atrás</button>
          ) : <div />}

          {requiresAction && !actionCompleted ? (
            <div className="flex items-center gap-2 text-violet-600 text-sm font-medium bg-violet-50 px-3 py-1.5 rounded-md">
              <span className="animate-spin border-2 border-violet-600 border-t-transparent rounded-full w-4 h-4"></span>
              Esperando acción...
            </div>
          ) : (
            <button {...primaryProps} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
              {isLastStep ? 'Terminar' : 'Siguiente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
