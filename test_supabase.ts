import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data } = await supabase.from('publicaciones').select('*, redes_sociales(nombre_red)').limit(2);
  console.log(JSON.stringify(data, null, 2));
}
test();
