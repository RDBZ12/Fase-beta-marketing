const fs = require('fs');
const files = [
  'src/components/ClientPortal.tsx',
  'src/components/CampaignWizard.tsx',
  'src/components/ClientModules.tsx',
  'src/components/MisPublicacionesModule.tsx'
];

const replacements = [
  { regex: /bg-\[#0f0f23\]/g, replacement: 'bg-slate-50' },
  { regex: /bg-\[#1a1a2e\](\/[0-9]+)?/g, replacement: 'bg-white' },
  { regex: /border-\[#2a2a4a\]/g, replacement: 'border-slate-200' },
  { regex: /text-slate-200/g, replacement: 'text-slate-800' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500' },
  { regex: /text-white/g, replacement: 'text-slate-900' },
  { regex: /text-slate-100/g, replacement: 'text-slate-900' }
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(file, content, 'utf8');
}
console.log('Colors replaced successfully!');
