import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Campaign } from '../types';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
  campaignToEdit?: Campaign | null;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  campaignToEdit,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [channel, setChannel] = useState<Campaign['channel']>('Email');
  const [status, setStatus] = useState<Campaign['status']>('Activa');
  const [leads, setLeads] = useState(0);
  const [reach, setReach] = useState('');
  const [ctr, setCtr] = useState(0.0);
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (campaignToEdit) {
      setName(campaignToEdit.name);
      setBrand(campaignToEdit.brand || '');
      setImageUrl(campaignToEdit.image_url || '');
      setChannel(campaignToEdit.channel);
      setStatus(campaignToEdit.status);
      setLeads(campaignToEdit.leads);
      setReach(campaignToEdit.reach);
      setCtr(campaignToEdit.ctr);
      setStartDate(campaignToEdit.startDate);
    } else {
      setName('');
      setBrand('');
      setImageUrl('');
      setChannel('Email');
      setStatus('Activa');
      setLeads(0);
      setReach('');
      setCtr(0.0);
      // Format current date: DD MMM YYYY
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('es-ES', options).replace(/\./g, '');
      setStartDate(formattedDate);
    }
  }, [campaignToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('El nombre de la campaña es requerido.');
    if (!brand.trim()) return alert('La marca de tabaco es requerida.');

    const campaignData: Campaign = {
      id: campaignToEdit ? campaignToEdit.id : Math.random().toString(36).substring(2, 9),
      name,
      brand,
      image_url: imageUrl,
      channel,
      status,
      leads: Number(leads),
      reach: reach || '0',
      ctr: Number(ctr),
      startDate,
    };

    onSave(campaignData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">
            {campaignToEdit ? 'Modificar Campaña' : 'Crear Nueva Campaña'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre de la Campaña
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Q2 Lead Generation"
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Marca de Tabaco
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej. Marlboro, Lucky Strike, etc."
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Imagen Publicitaria (Cargar Imagen)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-all duration-200"
            />
            {imageUrl && (
              <div className="mt-2 relative inline-block">
                <img src={imageUrl} alt="Vista previa" className="h-16 w-auto rounded-lg object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Canal
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Campaign['channel'])}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              >
                <option value="Email">Email</option>
                <option value="Social">Social</option>
                <option value="Display">Display</option>
                <option value="Multi">Multi</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Campaign['status'])}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              >
                <option value="Activa">Activa</option>
                <option value="Pausada">Pausada</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Leads
              </label>
              <input
                type="number"
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Alcance
              </label>
              <input
                type="text"
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                placeholder="Ej. 142K"
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                CTR (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={ctr}
                onChange={(e) => setCtr(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Fecha de Inicio
            </label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Ej. 01 Jun 2026"
              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/30 -mx-5 -mb-5 p-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-200 transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all duration-150"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
