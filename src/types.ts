export interface Campaign {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  channel: 'Email' | 'Social' | 'Display' | 'Multi';
  status: 'Activa' | 'Pausada' | 'Completada';
  leads: number;
  reach: string;
  ctr: number;
  startDate: string;
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}
