import http from 'node:http';
import https from 'node:https';

// HTTP/HTTPS fetch that bypasses TLS verification for local self-signed certificates.
function backendFetch(urlString, { method = 'GET', headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const mod = url.protocol === 'https:' ? https : http;
        const req = mod.request(
            {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers,
                rejectUnauthorized: false, // nosemgrep: bypass-tls-verification
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () =>
                    resolve({
                        status: res.statusCode,
                        rawHeaders: res.headers,
                        contentType: res.headers['content-type'] || '',
                        setCookies: [].concat(res.headers['set-cookie'] ?? []),
                        body: Buffer.concat(chunks).toString('utf-8'),
                    }),
                );
            },
        );
        req.on('error', reject);
        req.end();
    });
}

// Intercepts HTML responses from the PHP backend, rewrites atro.min.js to the Vite dev
// entry, and makes all absolute backend URLs relative so they pass through the proxy.
export function devProxyPlugin(backendUrl) {
    const origin = new URL(backendUrl).origin;
    const originRe = new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=/)', 'g');

    return {
        name: 'dev-proxy',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url || '/';
                const accept = req.headers['accept'] || '';

                if (url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/') || !accept.includes('text/html')) {
                    return next();
                }

                try {
                    const target = new URL(url, backendUrl);
                    const headers = { ...req.headers, host: target.host };
                    delete headers['accept-encoding'];

                    console.log(`[dev-proxy] → ${target}`);
                    let response = await backendFetch(target.toString(), { method: req.method, headers });

                    // Follow one redirect (e.g. http → https)
                    if (response.status >= 300 && response.status < 400 && response.rawHeaders['location']) {
                        const loc = response.rawHeaders['location'];
                        const redirectUrl = loc.startsWith('http') ? loc : new URL(loc, backendUrl).toString();
                        response = await backendFetch(redirectUrl, { method: 'GET', headers });
                    }

                    console.log(`[dev-proxy] ← ${response.status}`);

                    if (!response.contentType.includes('text/html')) return next();

                    let html = response.body
                        .replace(originRe, '')
                        .replace(
                            /<script[^>]+atro\.min\.js[^"]*"[^>]*><\/script>/,
                            `<script type="module" src="/src/dev-main.ts"></script>`,
                        );

                    const skip = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie']);
                    for (const [key, val] of Object.entries(response.rawHeaders)) {
                        if (!skip.has(key.toLowerCase())) res.setHeader(key, val);
                    }
                    if (response.setCookies.length) {
                        res.setHeader('set-cookie', response.setCookies.map((c) => c.replace(/;\s*domain=[^;,]*/gi, '')));
                    }

                    res.setHeader('content-type', 'text/html; charset=utf-8');
                    res.statusCode = response.status;
                    res.end(html);
                } catch (err) {
                    console.error('[dev-proxy]', err.message);
                    res.statusCode = 502;
                    res.setHeader('content-type', 'text/html; charset=utf-8');
                    res.end(`<pre>[dev-proxy] cannot reach ${backendUrl}\n\n${err.message}</pre>`);
                }
            });
        },
    };
}