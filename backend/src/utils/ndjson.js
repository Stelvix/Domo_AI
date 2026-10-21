/**
 * Parseur NDJSON incrémental (Newline Delimited JSON).
 *
 * Problème résolu : lors d'un flux HTTP, un objet JSON peut être coupé au milieu
 * par le réseau. Un simple `chunk.split('\n')` écarte alors silencieusement
 * une partie de la réponse du modèle.
 *
 * Ce parseur conserve le fragment résiduel dans un buffer interne et ne
 * n'émet un objet que lorsque sa ligne est complète.
 *
 * @param {(payload: any) => void} onObject Callback appelé pour chaque objet JSON valide.
 * @param {(raw: string, error: Error) => void} [onError] Callback optionnel pour les lignes invalides.
 */
export function createNdjsonParser(onObject, onError) {
  let buffer = '';

  const emit = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      onObject(JSON.parse(trimmed));
    } catch (error) {
      if (onError) onError(trimmed, error);
    }
  };

  return {
    /**
     * Consomme un fragment de texte et émet les objets JSON complets qu'il contient.
     * @param {string} chunk
     */
    push(chunk) {
      if (!chunk) return;
      buffer += chunk;

      const lines = buffer.split('\n');
      // La dernière partie est potentiellement incomplète : on la conserve.
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        emit(line);
      }
    },

    /**
     * Traite le buffer résiduel (fin de flux sans saut de ligne final).
     */
    flush() {
      if (!buffer.trim()) {
        buffer = '';
        return;
      }
      emit(buffer);
      buffer = '';
    },
  };
}
