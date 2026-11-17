import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // three.js alone is ~600 kB minified; that's expected for a 3D app.
    chunkSizeWarningLimit: 800,
  },
});
