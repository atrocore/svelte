import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

import http from 'node:http';
import https from 'node:https';

import { devProxyPlugin, devStaticPlugin } from './vite-dev-proxy.js';

dotenv.config();

const alias = {
    $lib: resolve(__dirname, 'src/lib'),
    $assets: resolve(__dirname, 'src/assets'),
};

export default defineConfig(({ command }) => {
    if (command === 'serve') {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const publicDir = resolve(__dirname, process.env.PUBLIC_PATH || '../../public');
        const isSecureBackend = new URL(backendUrl).protocol === 'https:';

        // Reusing sockets saves a connection and a DNS lookup on every proxied request.
        const agent = new (isSecureBackend ? https.Agent : http.Agent)({
            keepAlive: true,
            maxSockets: 64,
            rejectUnauthorized: false,
        });

        return {
            plugins: [svelte(), devStaticPlugin(publicDir), devProxyPlugin(backendUrl)],
            resolve: { alias },
            optimizeDeps: {
                entries: ['src/dev-main.ts'],
            },
            server: {
                port: Number(process.env.DEV_PORT) || 5173,
                warmup: {
                    clientFiles: ['./src/dev-main.ts', './src/main.ts'],
                },
                proxy: {
                    '^(?!/@|/src/|/node_modules/)': {
                        target: backendUrl,
                        changeOrigin: true,
                        secure: false,
                        agent,
                    },
                },
            },
        };
    }

    const atrocorePath = resolve(__dirname, '../atrocore');
    const outDir = process.env.BUILD_PATH
        ?? (existsSync(atrocorePath) ? '../atrocore/client' : '../client');

    return {
        plugins: [svelte()],
        base: '/client',
        build: {
            minify: true,
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
