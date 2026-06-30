const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase vars found in .env.local, trying .env");
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  const { data, error } = await supabase
    .from('publicaciones')
    .update({ estado: 'Publicada' })
    .eq('estado', 'Programada')
    .lt('fecha_publicacion', new Date(Date.now() + 5*60000).toISOString())
    .select('id_publicacion, titulo');
    
  if (error) {
    console.error(error);
  } else {
    console.log("Updated to Publicada:", data);
  }
}
fix();
