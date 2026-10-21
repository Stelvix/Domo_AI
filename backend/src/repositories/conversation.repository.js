import { getPrisma } from '../config/prisma.js';

export class ConversationRepository {
  /**
   * Client Prisma (instancié à la première requête).
   */
  get prisma() {
    return getPrisma();
  }

  /**
   * Crée une nouvelle conversation pour un agent donné
   */
  async createConversation(agentId, title = 'Nouvelle discussion') {
    return this.prisma.conversation.create({
      data: {
        agentId,
        title,
      },
      include: {
        agent: true,
      },
    });
  }

  /**
   * Récupère la liste des conversations associées à un agent
   */
  async findByAgentId(agentId) {
    return this.prisma.conversation.findMany({
      where: { agentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Dernier message pour aperçu
        },
      },
    });
  }

  /**
   * Récupère une conversation spécifique avec l'historique complet des messages
   */
  async findByIdWithMessages(conversationId) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Enregistre un message dans une conversation et actualise l'horodatage de celle-ci
   */
  async createMessage(conversationId, role, content) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          role,
          content,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  /**
   * Supprime une conversation et ses messages en cascade
   */
  async deleteConversation(conversationId) {
    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}

export const conversationRepository = new ConversationRepository();
