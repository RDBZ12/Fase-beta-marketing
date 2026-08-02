import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/campaigns?select=publico_objetivo&limit=1';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(async res => {
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  })
  .catch(console.error);
