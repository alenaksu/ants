import { defineConfig } from 'vite';

export default defineConfig({
    base: '/ants/',
    build: {
        target: 'esnext',
        outDir: 'docs',
        emptyOutDir: true,
        sourcemap: true,
    },
});
