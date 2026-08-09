const fs = require('fs');
const file = 'src/lib/whatsapp.ts';
let content = fs.readFileSync(file, 'utf8');

// Update getOpenWASettings to remove hardcoded keys
content = content.replace(
  /apiKey:\s*localKey\s*\|\|\s*import\.meta\.env\.VITE_OPENWA_API_KEY\s*\|\|\s*'[^']+',/g,
  'apiKey: localKey || "",'
);

// Add fetchOpenWA helper
const fetchOpenWaHelper = `
async function fetchOpenWA(path: string, options: any = {}) {
  const { apiUrl, apiKey } = getOpenWASettings();
  // if apiUrl is an absolute URL or proxy-openwa, we still use our backend proxy
  const res = await fetch('/api/openwa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : undefined,
      apiUrl,
      apiKey // Send local apiKey to backend if user provided one
    })
  });
  return res;
}
`;

content = content.replace(/function getHeaders.*?\}/s, fetchOpenWaHelper + '\nfunction getHeaders(apiKey: string) { return { "Content-Type": "application/json" }; }');

// Now replace all fetch calls.
content = content.replace(/fetch\(\s*`\$\{apiUrl\}\/([^`]+)`\s*,\s*\{([^}]+)\}\s*\)/g, 'fetchOpenWA(\'/$1\', {$2})');

fs.writeFileSync(file, content);
