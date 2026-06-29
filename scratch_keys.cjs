const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env'));

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) console.error(error);
  else if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]));
  else console.log('Table is empty, no keys.');
}
test();
