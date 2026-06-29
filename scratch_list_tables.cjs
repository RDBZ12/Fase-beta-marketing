const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_tables_list'); // Oh wait, we might not have this RPC. Let's just do a select from pg_catalog or query campaigns/usuarios.
  console.log("Error:", error);
  console.log("Data:", data);

  // Let's run a raw query using supabase if possible, or try selecting from different tables:
  const tables = ['usuarios', 'clientes', 'clientes_portal', 'campaigns', 'pagos', 'publicaciones', 'interacciones'];
  for (const table of tables) {
    const { data: selectData, error: selectErr } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}:`, selectErr ? `ERROR: ${selectErr.message}` : `OK (${selectData.length} rows)`);
  }
}

run();
