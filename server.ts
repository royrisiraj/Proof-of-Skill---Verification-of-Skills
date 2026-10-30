import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleExecute } from './src/server/executeHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Dev server must always bind to Port 3000 per environment constraints
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? Number(process.env.PORT) : 3000;

  // Enforce uniform 64 KB JSON payload limit
  app.use(express.json({ limit: '64kb' }));

  // API Endpoints
  app.post('/api/execute', handleExecute);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'proof-of-skill-api',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proof of Skill server running on http://0.0.0.0:${PORT} [${isProduction ? 'prod' : 'dev'}]`);
  });
}

startServer();
