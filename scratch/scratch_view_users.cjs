const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: errUsers } = await supabase.from('usuarios').select('*');
  console.log("=== USUARIOS ===");
  if (errUsers) console.error("Error fetching usuarios:", errUsers);
  else console.log(users);

  const { data: clients, error: errClients } = await supabase.from('clientes_portal').select('*');
  console.log("=== CLIENTES PORTAL ===");
  if (errClients) console.error("Error fetching clientes:", errClients);
  else console.log(clients);
}

run();
