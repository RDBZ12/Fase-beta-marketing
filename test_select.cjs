const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('publicaciones').select('*, redes_sociales(nombre_red)').limit(2);
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}
run();
