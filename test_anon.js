import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

async function run() {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/campaigns?limit=1`, {
    headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY }
  });
  console.log(await res.json());
}
run();
