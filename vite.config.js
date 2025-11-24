import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Subimos el límite de aviso a 1500kb para que no moleste al compilar
    chunkSizeWarningLimit: 1500, 
    rollupOptions: {
      output: {
        // Separa las librerías grandes (Firebase) del código de la app
        // Esto hace que cargue más rápido en móviles 4G
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})