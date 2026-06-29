const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies'); // Supabase doesn't have this usually
  // Let's just try to select and insert a test campaign using the anon key but without auth
}
