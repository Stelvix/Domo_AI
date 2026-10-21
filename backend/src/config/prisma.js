import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma initialisé à la demande (lazy loading).
 *
 * Pourquoi ? L'instanciation de `PrismaClient` déclenche le chargement du moteur
 * Query Engine (un processus natif). Ce chargement est asynchrone et provoque
 * des erreurs non gérées si le module est importé dans un contexte qui n'a
 * pas besoin de la base de données (tests unitaires, scripts CLI).
 *
 * En instanciant le client à la première requête réelle, on évite ce bruit et
 * on rend le démarrage du serveur plus rapide.
 */
const globalForPrisma = globalThis;

let client = null;

/**
 * Retourne l'instance partagée du client Prisma (créée au premier appel).
 */
export function getPrisma() {
  if (!client) {
    client =
      globalForPrisma.prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
  }

  return client;
}

/**
 * Ferme proprement la connexion Prisma si elle a été initialisée.
 */
export async function disconnectPrisma() {
  if (client) {
    await client.$disconnect();
    client = null;
    globalForPrisma.prisma = undefined;
  }
}

export default getPrisma;
