const SUPABASE_URL = 'https://eywguvnrxzbscjwmjxzw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OF9e-o-12JJNCKtshkf1yA_v7x5dCmS';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function checkData() {
  console.log("=== ÚLTIMAS CAMPAÑAS ===");
  const campRes = await fetch(`${SUPABASE_URL}/rest/v1/campaigns?select=id,created_at,nombre_campana,start_date&order=created_at.desc&limit=3`, { headers });
  const camps = await campRes.json();
  console.log(camps);

  console.log("\n=== ÚLTIMOS AUDIT LOGS ===");
  const logRes = await fetch(`${SUPABASE_URL}/rest/v1/audit_logs?select=*&order=changed_at.desc&limit=3`, { headers });
  const logs = await logRes.json();
  console.log(logs);
}

checkData();
