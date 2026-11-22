import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { forwardNoroff } from './api/noroff.js';

export default defineConfig(({ mode }) => {
  const { NOROFF_API_KEY } = loadEnv(mode, process.cwd(), 'NOROFF_');

  return {
    build: {
      rolldownOptions: {
        input: [
          'index.html',
          'browse/index.html',
          'listing/index.html',
          'how-it-works/index.html',
          'login/index.html',
          'register/index.html',
          'profile/index.html',
          'create/index.html',
        ],
      },
    },
    plugins: [tailwindcss(), {
      // Match the Vercel Function during `npm run dev` without exposing the API key.
      name: 'local-noroff-proxy',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (new URL(req.url, 'http://localhost').pathname !== '/api/noroff') return next();
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const headers = new Headers();
            if (req.headers.authorization) headers.set('Authorization', req.headers.authorization);
            if (req.headers['content-type']) headers.set('Content-Type', req.headers['content-type']);
            const request = new Request('http://localhost' + req.url, {
              method: req.method,
              headers,
              ...(chunks.length && { body: Buffer.concat(chunks) }),
            });
            const response = await forwardNoroff(request, { apiKey: NOROFF_API_KEY });
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ errors: [{ message: 'Local API proxy failed.' }] }));
          }
        });
      },
    }],
  };
});
