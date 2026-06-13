import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Metric } from '../types';

interface MetricCardsProps {
  metrics: Metric[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        return (
          <div 
            key={index}
            className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {metric.label}
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {metric.value}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span 
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  metric.isPositive 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {metric.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 stroke-[3]" />
                )}
                {metric.change}
              </span>
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                {metric.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
