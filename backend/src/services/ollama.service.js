import { env } from '../config/env.js';

export class OllamaService {
  constructor(baseUrl = env.OLLAMA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Construit un AbortController combining un signal externe et un timeout.
   * @param {AbortSignal} [externalSignal]
   * @param {number} [timeoutMs]
   */
  #createSignal(externalSignal, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'TimeoutError';
      controller.abort(timeoutError);
    }, timeoutMs);

    const abortFromExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal) {
      if (externalSignal.aborted) abortFromExternal();
      else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    }

    controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
    return controller.signal;
  }

  /**
   * Traduit une erreur réseau (connexion refusée, timeout, annulation) en une
   * erreur métier explicite et exploitable par le contrôleur.
   *
   * @param {Error} error
   * @param {string} message Message de fallback (connexion indisponible).
   * @param {AbortSignal} [externalSignal] Signal d'annulation fourni par l'appelant.
   */
  #normalizeError(error, message, externalSignal) {
    // Annulation explicite du client : distinguée d'un timeout.
    if (externalSignal?.aborted) {
      const abortedError = new Error('Génération interrompue par le client.');
      abortedError.statusCode = 499;
      abortedError.code = 'CLIENT_ABORTED';
      return abortedError;
    }

    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      const timeoutError = new Error(
        `Délai de génération dépassé (${Math.round(env.OLLAMA_TIMEOUT_MS / 1000)}s) pour le modèle.`
      );
      timeoutError.statusCode = 504;
      timeoutError.code = 'OLLAMA_TIMEOUT';
      return timeoutError;
    }

    if (error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED') {
      const unavailableError = new Error(message);
      unavailableError.statusCode = 503;
      unavailableError.code = 'OLLAMA_UNAVAILABLE';
      return unavailableError;
    }

    return error;
  }

  /**
   * Vérifie la disponibilité du serveur Ollama et retourne sa version.
   * @returns {Promise<{ online: boolean, version: string|null }>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        signal: this.#createSignal(undefined, env.OLLAMA_CONTROL_TIMEOUT_MS),
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
        signal: this.#createSignal(undefined, env.OLLAMA_CONTROL_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Erreur Ollama (${response.status}) : ${errorText}`);
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      throw this.#normalizeError(
        error,
        `Impossible de se connecter à Ollama sur ${this.baseUrl}. Assurez-vous que le service Ollama est actif.`
      );
    }
  }

  /**
   * Récupère les modèles actuellement chargés en mémoire (/api/ps).
   * @returns {Promise<string[]>} Liste des noms de modèles chargés.
   */
  async getRunningModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ps`, {
        signal: this.#createSignal(undefined, env.OLLAMA_CONTROL_TIMEOUT_MS),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((model) => model.name);
    } catch {
      return [];
    }
  }

  /**
   * Envoie une requête de chat vers Ollama (/api/chat).
   * Supporte le mode streaming (ReadableStream) ou complet (JSON).
   *
   * @param {{ model: string, messages: {role:string, content:string}[], stream?: boolean, signal?: AbortSignal, options?: object }} params
   */
  async chat({ model, messages, stream = false, signal, options }) {
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
          ...(options ? { options } : {}),
        }),
        signal: this.#createSignal(signal, env.OLLAMA_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Erreur Ollama (${response.status}) : ${errorText}`);
        error.statusCode = response.status;
        throw error;
      }

      if (stream) {
        return response.body; // ReadableStream brut, consommé par le service de chat
      }

      return await response.json();
    } catch (error) {
      throw this.#normalizeError(
        error,
        `Impossible de joindre Ollama (${this.baseUrl}) pendant la génération.`,
        signal
      );
    }
  }
}

export const ollamaService = new OllamaService();
