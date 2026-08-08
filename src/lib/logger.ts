import { supabase } from '../supabaseClient';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export const logSystemEvent = async (
  level: LogLevel,
  source: string,
  message: string,
  metadata: any = {}
) => {
  try {
    const { error } = await supabase.from('system_logs').insert([
      {
        level,
        source,
        message,
        metadata
      }
    ]);

    if (error) {
      console.error('Error al guardar log en system_logs:', error);
    }
  } catch (e) {
    console.error('Fallo crítico en el logger:', e);
  }
};
