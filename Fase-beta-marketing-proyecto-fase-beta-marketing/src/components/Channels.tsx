import React from 'react';
import { Trash2 } from 'lucide-react';

interface ChannelsProps {
  onClearTestData: () => void;
}

export const Channels: React.FC<ChannelsProps> = ({ onClearTestData }) => {
  const channelsData = [
    { name: 'Email', percentage: 68, color: 'bg-violet-600' },
    { name: 'Social', percentage: 87, color: 'bg-pink-500' },
    { name: 'Display', percentage: 41, color: 'bg-amber-500' },
    { name: 'Multi', percentage: 55, color: 'bg-indigo-600' },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm w-full lg:w-80 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Canales</h3>
        
        <div className="space-y-4">
          {channelsData.map((channel, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">{channel.name}</span>
                <span className="text-slate-400">{channel.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${channel.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${channel.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onClearTestData}
        className="w-full mt-6 py-2.5 px-4 text-xs font-bold text-rose-500 border border-rose-100 hover:border-rose-200 hover:bg-rose-50/30 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Eliminar datos de prueba</span>
      </button>
    </div>
  );
};
