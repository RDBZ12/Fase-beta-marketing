const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('redes_sociales')
    .insert([
      {
        nombre_red: 'Telegram',
        url: 'https://telegram.org',
        estado: 'activo',
        icono: 'send'
      }
    ])
    .select();

  if (error) {
    console.error("Error inserting Telegram:", error);
  } else {
    console.log("Success! Telegram added to redes_sociales:", data);
  }
}

run();
