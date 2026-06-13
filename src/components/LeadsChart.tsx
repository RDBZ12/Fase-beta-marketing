import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  leads: number;
}

export const LeadsChart: React.FC = () => {
  const data: ChartDataPoint[] = [
    { month: 'Ene', leads: 1200 },
    { month: 'Feb', leads: 2800 },
    { month: 'Mar', leads: 2200 },
    { month: 'Abr', leads: 3900 },
    { month: 'May', leads: 4300 },
    { month: 'Jun', leads: 6238 },
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG parameters
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = 7000;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.leads / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // SVG Path definitions
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Leads por mes</h3>
          <p className="text-xs text-slate-400 font-medium">Enero — Junio 2026</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+256% YTD</span>
        </div>
      </div>

      <div className="relative w-full h-[240px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1000, 2000, 3000, 4000, 5000, 6000].map((val) => {
            const y = height - paddingBottom - (val / maxVal) * chartHeight;
            return (
              <g key={val} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[10px] fill-slate-400 font-medium font-mono"
                >
                  {val === 0 ? '0' : val >= 1000 ? `${val / 1000}k` : val}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive elements */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Vertical hover guide */}
              {hoveredIndex === i && (
                <line 
                  x1={p.x} 
                  y1={paddingTop} 
                  x2={p.x} 
                  y2={height - paddingBottom} 
                  stroke="#c084fc" 
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Data circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? '#8b5cf6' : '#ffffff'}
                stroke="#8b5cf6"
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* X Axis Labels */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className={`text-[11px] font-semibold transition-colors duration-200 ${
                  hoveredIndex === i ? 'fill-slate-800' : 'fill-slate-400'
                }`}
              >
                {p.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredIndex !== null && (
          <div 
            className="absolute bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-800 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 4}%`,
            }}
          >
            <p className="text-slate-400 font-medium">{data[hoveredIndex].month}</p>
            <p className="text-white text-xs mt-0.5">{data[hoveredIndex].leads.toLocaleString()} leads</p>
          </div>
        )}
      </div>
    </div>
  );
};
