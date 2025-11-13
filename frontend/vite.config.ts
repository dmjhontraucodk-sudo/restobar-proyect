// vite.config.ts (VERSIÓN CORREGIDA)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    
    // 🔥 PROXY CORREGIDO - FORZAR HEADER
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔧 [VITE PROXY] Proxying request to:', req.url);
            
            // ✨ FORZAR EL HEADER BASADO EN LA URL DEL FRONTEND ✨
            const originalHost = req.headers.origin || req.headers.referer;
            console.log('🔧 [VITE PROXY] Original host:', originalHost);
            
            if (originalHost) {
              try {
                const url = new URL(originalHost);
                const hostname = url.hostname;
                console.log('🔧 [VITE PROXY] Parsed hostname:', hostname);
                
                if (hostname.includes('.localhost')) {
                  const subdomain = hostname.split('.')[0];
                  if (subdomain !== 'localhost') {
                    proxyReq.setHeader('X-Tenant-Subdomain', subdomain);
                    console.log('🔧 [VITE PROXY] ✅ Setting X-Tenant-Subdomain:', subdomain);
                  }
                } else if (hostname === 'localhost') {
                  proxyReq.setHeader('X-Tenant-Subdomain', 'rb');
                  console.log('🔧 [VITE PROXY] ✅ Default tenant: rb');
                }
              } catch (error) {
                console.log('🔧 [VITE PROXY] ❌ Error parsing URL:', error);
              }
            }
            
            // Log todos los headers que se envían
            console.log('🔧 [VITE PROXY] Final headers:', {
              'x-tenant-subdomain': proxyReq.getHeader('X-Tenant-Subdomain'),
              'host': proxyReq.getHeader('Host'),
              'origin': proxyReq.getHeader('Origin')
            });
          });
        }
      }
    }
  }
})