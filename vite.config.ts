import { defineConfig } from 'vite';

export default defineConfig({
    base: '/ants/',
    build: {
        target: 'es2022',
        outDir: 'docs',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    pixi: ['pixi.js'],
                },
            },
        },
    },
});
