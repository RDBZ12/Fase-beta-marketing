import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usamos valores temporales para evitar que el 'build' de Vercel falle si faltan las variables
export const supabase = createClient(
  supabaseUrl || 'https://ejemplo.supabase.co',
  supabaseAnonKey || 'ejemplo_key',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Limpiar el fragmento de la URL tras procesar el token para no exponerlo en el historial
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});
