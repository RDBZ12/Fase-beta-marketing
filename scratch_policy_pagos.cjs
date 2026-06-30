const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Running SQL script...");
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: `
    DROP POLICY IF EXISTS "Clientes pueden ver sus propios pagos" ON public.pagos;
    CREATE POLICY "Clientes pueden ver sus propios pagos"
      ON public.pagos FOR SELECT
      TO authenticated
      USING (id_usuario = auth.uid());
    `
  });
  if (error) {
    console.error("Error executing RPC exec_sql:", error);
  } else {
    console.log("Success:", data);
  }
}
run();
