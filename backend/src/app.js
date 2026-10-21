import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isOriginAllowed } from './config/env.js';
import { ollamaService } from './services/ollama.service.js';
import agentRoutes from './routes/agent.routes.js';
import chatRoutes from './routes/chat.routes.js';
import ollamaRoutes from './routes/ollama.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

/**
 * Détermine si l'origine de la requête correspond à l'hôte qui a servi
 * l'application (accès direct à la PWA depuis le mobile sur le réseau local).
 */
function isSameHost(origin, req) {
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// Security & Parsing Middlewares
app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    callback(null, {
      origin: isOriginAllowed(origin) || isSameHost(origin, req),
      credentials: true,
    });
  })
);
app.use(express.json({ limit: '2mb' }));

// Health check endpoint : état de l'API + joignabilité d'Ollama
app.get('/api/health', async (req, res) => {
  const ollama = await ollamaService.checkHealth();

  res.status(200).json({
    status: 'ok',
    service: 'Ollama Pixel Office Backend',
    timestamp: new Date().toISOString(),
    ollama: {
      online: ollama.online,
      version: ollama.version,
      baseUrl: env.OLLAMA_BASE_URL,
    },
  });
});

// Mounting Business Domain Routes
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ollama', ollamaRoutes);

// Production Static Serving for Vue 3 PWA
if (env.SERVE_STATIC && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // SPA Catch-All fallback for client-side routing (excluding /api routes)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 Route Handler for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Point de terminaison non trouvé : ${req.method} ${req.originalUrl}`,
    },
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
