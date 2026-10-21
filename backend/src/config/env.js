import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Convertit une variable d'environnement en entier positif.
 */
function parseIntEnv(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Analyse une liste d'origines séparées par des virgules.
 */
function parseOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const rawCorsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || 'http://localhost:5173';

export const env = {
  PORT: parseIntEnv(process.env.PORT, 3001),
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  OLLAMA_BASE_URL: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
  CORS_ORIGIN: rawCorsOrigin,
  CORS_ORIGINS: parseOrigins(rawCorsOrigin),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  SERVE_STATIC: process.env.SERVE_STATIC === 'true' || process.env.NODE_ENV === 'production',

  /**
   * Délai maximal d'une génération LLM (chargement du modèle inclus).
   * Les modèles locaux peuvent nécessitent plusieurs minutes au premier appel.
   */
  OLLAMA_TIMEOUT_MS: parseIntEnv(process.env.OLLAMA_TIMEOUT_MS, 10 * 60 * 1000),
  /** Délai maximal des appels de contrôle (health check, listing des modèles). */
  OLLAMA_CONTROL_TIMEOUT_MS: parseIntEnv(process.env.OLLAMA_CONTROL_TIMEOUT_MS, 5000),
  /** Intervalle d'envoi des keep-alive SSE (évite les timeouts de proxy). */
  SSE_HEARTBEAT_INTERVAL_MS: parseIntEnv(process.env.SSE_HEARTBEAT_INTERVAL_MS, 15000),
  /** Nombre de messages d'historique réinjectés dans le contexte LLM. */
  CHAT_HISTORY_LIMIT: parseIntEnv(process.env.CHAT_HISTORY_LIMIT, 20),
  /** Nombre de colonnes de la grille pixel art du bureau. */
  OFFICE_GRID_COLUMNS: parseIntEnv(process.env.OFFICE_GRID_COLUMNS, 4),
  /**
   * Adresse IP LAN de la machine hôte (joignable depuis un smartphone).
   * Indispensable lorsque l'API tourne dans un conteneur : les interfaces du
   * conteneur (172.17.x.x) ne sont pas accessibles depuis le réseau local.
   */
  HOST_LAN_IP: process.env.HOST_LAN_IP || null,
};

/**
 * Détermine si une origine est autorisée par la politique CORS.
 *
 * En développement, toutes les origines "loopback" et "réseau local" sont
 * acceptées afin de pouvoir tester la PWA depuis un smartphone sur le LAN.
 */
export function isOriginAllowed(origin) {
  if (!origin) return true; // Requêtes same-origin / serveur à serveur (curl, healthcheck Docker)
  if (env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(origin)) return true;
  if (!env.IS_DEVELOPMENT) return false;

  return (
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin) ||
    /^https?:\/\/(192\.168|10)\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)
  );
}
