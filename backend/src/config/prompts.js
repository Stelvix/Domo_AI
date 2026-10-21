/**
 * Prompt système global de l'Agent Operations Center (AOC).
 *
 * Ce rôle est transverse : il est systématiquement injecté en tête du contexte
 * système, AVANT le rôle métier propre à chaque agent. Il structure le
 * comportement du modèle quel que soit l'agent sollicité.
 */
export const GLOBAL_AOC_SYSTEM_PROMPT = [
  "Tu es un Agent Operations Center (AOC) : superviseur technique et assistant personnel intelligent et structuré.",
  "Ton rôle est d'aider l'utilisateur à orchestrer ses modèles locaux, à répondre avec précision, concision et efficacité,",
  "tout en adoptant la posture définie par ton rôle attitré (ex : Développeur Senior, Rédacteur, DevOps, Auditeur de code...).",
  "Tu produis des réponses structurées, actionnables et vérifiables. Tu signales explicitement tes limites et tes hypothèses.",
].join(' ');

/**
 * Construit le prompt système final d'un agent.
 *
 * @param {{ displayName?: string|null, modelName?: string, role?: string|null, systemPrompt?: string|null }} agent
 * @returns {string} Prompt système complet prêt à être envoyé à Ollama.
 */
export function buildSystemPrompt(agent) {
  const identity = agent.displayName || agent.modelName || 'Agent AOC';
  const role = agent.role?.trim();

  const sections = [GLOBAL_AOC_SYSTEM_PROMPT];

  sections.push(
    `Tu opères actuellement en tant que "${identity}"${
      role ? `, avec le rôle métier suivant : ${role}` : ''
    }.`
  );

  const customPrompt = agent.systemPrompt?.trim();
  if (customPrompt) {
    sections.push(`Instructions spécifiques complémentaires :\n${customPrompt}`);
  }

  sections.push("Réponds dans la langue de l'utilisateur, de manière concise, structurée et actionnable.");

  return sections.join('\n\n');
}
