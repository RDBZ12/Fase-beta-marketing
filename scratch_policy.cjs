const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY); // using anon key to run rpc is usually denied, I might need psql

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: `
    CREATE POLICY "campaigns_insert_cliente"
      ON public.campaigns FOR INSERT
      TO authenticated
      WITH CHECK (
        id_cliente = (
          SELECT id_cliente FROM public.clientes_portal
          WHERE auth_user_id = auth.uid()
        )
      );
    CREATE POLICY "campaigns_update_cliente"
      ON public.campaigns FOR UPDATE
      TO authenticated
      USING (
        id_cliente = (
          SELECT id_cliente FROM public.clientes_portal
          WHERE auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        id_cliente = (
          SELECT id_cliente FROM public.clientes_portal
          WHERE auth_user_id = auth.uid()
        )
      );
    `
  });
  console.log(error || data);
}
test();
