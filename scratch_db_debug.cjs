const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- CLIENTES PORTAL ---");
  const { data: clients, error: errC } = await supabase.from('clientes_portal').select('*');
  console.log(JSON.stringify(clients, null, 2), errC);

  console.log("--- PAGOS ---");
  const { data: pagos, error: errP } = await supabase.from('pagos').select('*').limit(5);
  console.log(JSON.stringify(pagos, null, 2), errP);
}

run();
