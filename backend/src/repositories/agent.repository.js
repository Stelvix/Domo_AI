import prisma from '../config/prisma.js';

export class AgentRepository {
  /**
   * Récupère tous les agents enregistrés
   */
  async findAll() {
    return prisma.agentConfig.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
    });
  }

  /**
   * Recherche un agent par son identifiant unique UUID
   */
  async findById(id) {
    return prisma.agentConfig.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Recherche un agent par le nom technique de son modèle Ollama
   */
  async findByModelName(modelName) {
    return prisma.agentConfig.findUnique({
      where: { modelName },
    });
  }

  /**
   * Recherche l'agent occupant une case de la grille pixel art
   */
  async findByPosition(positionX, positionY) {
    return prisma.agentConfig.findFirst({
      where: { positionX, positionY },
    });
  }

  /**
   * Crée un nouvel agent
   */
  async create(data) {
    return prisma.agentConfig.create({
      data,
    });
  }

  /**
   * Met à jour la configuration d'un agent
   */
  async update(id, data) {
    return prisma.agentConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * Met à jour ou insère un agent selon le nom de modèle
   */
  async upsertByModelName(modelName, defaultData) {
    return prisma.agentConfig.upsert({
      where: { modelName },
      update: {}, // Conserve les réglages personnalisés existants (rôle, position, etc.)
      create: {
        modelName,
        displayName: defaultData.displayName || modelName,
        role: defaultData.role || 'Superviseur AOC',
        systemPrompt: defaultData.systemPrompt || null,
        positionX: defaultData.positionX ?? 0,
        positionY: defaultData.positionY ?? 0,
        avatarSprite: defaultData.avatarSprite || 'agent-default',
      },
    });
  }

  /**
   * Supprime un agent
   */
  async delete(id) {
    return prisma.agentConfig.delete({
      where: { id },
    });
  }

  /**
   * Compte le nombre d'agents
   */
  async count() {
    return prisma.agentConfig.count();
  }
}

export const agentRepository = new AgentRepository();
