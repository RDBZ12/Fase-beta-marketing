import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert([{
      table_name: 'auth',
      action: 'TEST_INSERT',
      user_id: null,
      new_data: { event: 'test' }
    }]);
  console.log(error ? error : 'Success insert');
}
run();
