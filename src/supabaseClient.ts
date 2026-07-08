import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Advertencia: Faltan variables de entorno de Supabase. Asegúrate de configurarlas en Vercel (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).");
}

// Usamos valores temporales para evitar que el 'build' de Vercel falle si faltan las variables
export const supabase = createClient(
  supabaseUrl || 'https://ejemplo.supabase.co',
  supabaseAnonKey || 'ejemplo_key'
);
