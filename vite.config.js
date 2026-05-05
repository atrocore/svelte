import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

import { devProxyPlugin } from './vite-dev-proxy.js';

dotenv.config();

const alias = {
    $lib: resolve(__dirname, 'src/lib'),
    $assets: resolve(__dirname, 'src/assets'),
};

export default defineConfig(({ command }) => {
    if (command === 'serve') {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

        return {
            plugins: [svelte(), devProxyPlugin(backendUrl)],
            resolve: { alias },
            server: {
                port: 5173,
                proxy: {
                    '^(?!/@|/src/|/node_modules/)': {
                        target: backendUrl,
                        changeOrigin: true,
                        secure: false,
                    },
                },
            },
        };
    }

    const isWatch = process.argv.includes('--watch');
    const atrocorePath = resolve(__dirname, '../atrocore');
    const outDir = process.env.BUILD_PATH
        ?? (existsSync(atrocorePath) ? '../atrocore/client' : '../client');

    return {
        plugins: [svelte()],
        base: '/client',
        build: {
            minify: !isWatch,
            outDir,
            rollupOptions: {
                output: {
                    assetFileNames: ({ name }) => name === 'style.css' ? 'css/style.css' : 'assets/[name][extname]',
                },
            },
            lib: {
                entry: './src/main.ts',
                name: 'Svelte',
                formats: ['umd'],
                fileName: () => 'atro.min.js',
            },
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
        resolve: { alias },
    };
});
