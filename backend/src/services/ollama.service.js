import { env } from '../config/env.js';

export class OllamaService {
  constructor() {
    this.baseUrl = env.OLLAMA_BASE_URL;
  }

  /**
   * Vérifie la disponibilité du serveur Ollama
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return { online: false, version: null };
      const data = await response.json();
      return { online: true, version: data.version || 'unknown' };
    } catch {
      return { online: false, version: null };
    }
  }

  /**
   * Récupère la liste des modèles installés localement dans Ollama (/api/tags)
   */
  async getLocalModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      if (error.name === 'TimeoutError' || error.cause?.code === 'ECONNREFUSED') {
        const customErr = new Error(`Impossible de se connecter à Ollama sur ${this.baseUrl}. Assurez-vous que le service Ollama est actif.`);
        customErr.statusCode = 503;
        customErr.code = 'OLLAMA_UNAVAILABLE';
        throw customErr;
      }
      throw error;
    }
  }

  /**
   * Envoie une requête de chat vers Ollama (/api/chat)
   * Supporte le mode streaming (ReadableStream) ou complet (Promise)
   */
  async chat({ model, messages, stream = false }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`Erreur Ollama (${response.status}): ${errorText}`);
        err.statusCode = response.status;
        throw err;
      }

      if (stream) {
        return response.body; // Retourne le ReadableStream pour le streaming SSE / Chunked
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TimeoutError' || error.cause?.code === 'ECONNREFUSED') {
        const customErr = new Error(`Impossible de joindre Ollama (${this.baseUrl}) pendant la génération.`);
        customErr.statusCode = 503;
        customErr.code = 'OLLAMA_UNAVAILABLE';
        throw customErr;
      }
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();
