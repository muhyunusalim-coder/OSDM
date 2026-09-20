import express from 'express';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.argv[1]?.includes('server.cjs') ||
    Boolean(process.env.K_SERVICE);

  // Vite middleware for development only
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwd = process.cwd();
    const distPath = fs.existsSync(path.join(cwd, 'dist', 'index.html'))
      ? path.join(cwd, 'dist')
      : (fs.existsSync(path.join(cwd, 'index.html')) ? cwd : path.join(cwd, 'dist'));

    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
