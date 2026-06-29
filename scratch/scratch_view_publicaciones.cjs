const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: pubs, error } = await supabase
    .from('publicaciones')
    .select('*, redes_sociales(nombre_red)')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("=== PUBLICACIONES ===");
  if (error) console.error("Error:", error);
  else console.log(pubs);
}

run();
