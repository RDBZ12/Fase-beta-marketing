require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('campaigns').insert([{
        nombre_campana: 'Test',
        brand: 'Test',
        descripcion: 'Test',
        presupuesto: 1500,
        objetivo: 'Test',
        channel: 'Multi',
        estado: 'Pendiente de Pago',
        usuario_id: '1540ca7f-9f79-4ff3-982c-fcb38dfd1ce2'
  }]);
  console.log('Error:', error);
}
test();
