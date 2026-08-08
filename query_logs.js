require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', 'campaigns')
    .eq('action', 'UPDATE')
    .order('changed_at', { ascending: false })
    .limit(2);
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
