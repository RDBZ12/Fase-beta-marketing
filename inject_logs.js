import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY; 

async function run() {
  console.log("Fetching users...");
  let res = await fetch(`${url}/rest/v1/usuarios?select=id_usuario&limit=3`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${serviceKey}` }
  });
  const users = await res.json();
  const userId = users.length > 0 ? users[0].id_usuario : '00000000-0000-0000-0000-000000000000';

  console.log("Generating mock logs...");
  const now = new Date();
  
  const mockLogs = [
    {
      table_name: 'autenticacion',
      action: 'LOGIN',
      user_id: userId,
      old_data: null,
      new_data: { evento: 'Inicio de sesión', plataforma: 'Web App', ip: '192.168.1.15' },
      changed_at: new Date(now.getTime() - 55 * 60000).toISOString()
    },
    {
      table_name: 'campaigns',
      action: 'INSERT',
      user_id: userId,
      old_data: null,
      new_data: { id: 101, name: 'Campaña de Verano - Test', estado: 'Borrador', presupuesto: 150 },
      changed_at: new Date(now.getTime() - 45 * 60000).toISOString()
    },
    {
      table_name: 'leads',
      action: 'INSERT',
      user_id: userId,
      old_data: null,
      new_data: { nombre: 'María González', correo: 'maria@example.com', telefono: '809-555-1234' },
      changed_at: new Date(now.getTime() - 30 * 60000).toISOString()
    },
    {
      table_name: 'campaigns',
      action: 'UPDATE',
      user_id: userId,
      old_data: { id: 101, name: 'Campaña de Verano - Test', estado: 'Borrador', presupuesto: 150 },
      new_data: { id: 101, name: 'Campaña de Verano - Test', estado: 'Activa', presupuesto: 150 },
      changed_at: new Date(now.getTime() - 15 * 60000).toISOString()
    },
    {
      table_name: 'autenticacion',
      action: 'LOGOUT',
      user_id: userId,
      old_data: null,
      new_data: { evento: 'Cierre de sesión', plataforma: 'Web App' },
      changed_at: new Date(now.getTime() - 5 * 60000).toISOString()
    }
  ];

  console.log("Injecting logs...");
  res = await fetch(`${url}/rest/v1/audit_logs`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(mockLogs)
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to inject:", error);
  } else {
    console.log("Successfully injected 5 records!");
  }
}

run().catch(console.error);
