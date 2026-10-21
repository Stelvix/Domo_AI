import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 [AOC Backend] Serveur démarré sur http://localhost:${env.PORT}`);
  console.log(`🔌 [AOC Backend] Connexion Ollama configurée sur : ${env.OLLAMA_BASE_URL}`);
  console.log(`🌍 [AOC Backend] Origines CORS autorisées : ${env.CORS_ORIGINS.join(', ')}`);
  console.log(`🗄️  [AOC Backend] Base de données : ${env.DATABASE_URL}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ [AOC Backend] Le port ${env.PORT} est déjà utilisé. Libérez-le ou changez PORT dans backend/.env.`);
    process.exit(1);
  }
  throw error;
});

/**
 * Arrêt propre : fermeture du serveur HTTP et de la connexion Prisma.
 */
async function shutdown(signal) {
  console.log(`\n🛑 [AOC Backend] Signal ${signal} reçu, arrêt en cours...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ [AOC Backend] Arrêt terminé proprement.');
    process.exit(0);
  });

  // Filet de sécurité si des connexions restent ouvertes
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[AOC Backend] Rejection non gérée :', reason);
});
