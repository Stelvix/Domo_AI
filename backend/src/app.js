import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import agentRoutes from './routes/agent.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Ollama Pixel Office Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mounting Business Domain Routes
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);

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
