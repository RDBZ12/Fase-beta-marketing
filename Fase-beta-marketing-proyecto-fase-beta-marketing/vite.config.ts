import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}



// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_NETWORK_IP': JSON.stringify(getLocalIP())
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/proxy-openwa': {
        target: 'http://127.0.0.1:2785',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-openwa/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (_err: any, _req: any, res: any) => {
            // Silenciar los errores de proxy para no ensuciar la terminal
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'OpenWA Offline' }));
            }
          });
        }
      }
    }
  }
})

