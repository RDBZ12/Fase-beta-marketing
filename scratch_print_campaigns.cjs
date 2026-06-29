const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: campaigns, error } = await supabase.from('campaigns').select('*');
  console.log("Campaigns:", campaigns, error);

  const { data: pagos } = await supabase.from('pagos').select('*');
  console.log("Pagos:", pagos);

  const { data: tobacco } = await supabase.from('tobacco_products').select('*');
  console.log("Tobacco products:", tobacco);
}

run();
