const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: pagos, error: errPagos } = await supabase.from('pagos').select('*').order('fecha', { ascending: false }).limit(5);
  console.log("=== PAGOS ===");
  if (errPagos) console.error("Error fetching pagos:", errPagos);
  else console.log(pagos);

  const { data: campaigns, error: errCampaigns } = await supabase.from('campaigns').select('*').limit(5);
  console.log("=== CAMPAIGNS ===");
  if (errCampaigns) console.error("Error fetching campaigns:", errCampaigns);
  else console.log(campaigns);
}

run();
