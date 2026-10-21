import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`🚀 [AOC Backend] Serveur démarré sur http://localhost:${env.PORT}`);
  console.log(`🔌 [AOC Backend] Connexion Ollama configurée sur : ${env.OLLAMA_BASE_URL}`);
});
