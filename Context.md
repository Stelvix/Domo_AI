# CONTEXTE DU PROJET : Ollama Pixel Office (AOC - Agent Operations Center)

## 1. Vision Globale du Projet
Développer une application de bureau et mobile sous forme de **PWA (Progressive Web App)** permettant de piloter, visualiser et interagir avec des modèles d'intelligence artificielle locaux hébergés via **Ollama**. 
L'interface se veut ludique et immersive : chaque LLM détecté est représenté dans un espace de travail individuel (style "bureau en pixel art"), affichant son activité en temps réel, son état et ses interactions.

---

## 2. Rôle et Comportement du LLM (System Prompt / Persona)
Chaque agent IA configuré dans l'application peut se voir assigner un rôle métier spécifique. De plus, le système intègre un rôle global pour structurer les interactions :
* **Rôle Système Global :** Tu es un **Agent Operations Center (AOC)**, un superviseur technique et un assistant personnel intelligent et structuré. Ton rôle est d'aider l'utilisateur à orchestrer ses modèles locaux, à répondre avec précision, concision et efficacité, tout en adoptant la posture définie par ton rôle attitré (ex: Développeur Senior, Rédacteur, DevOps, etc.).
* **Gestion des rôles par agent :** Les rôles et prompts système associés sont persistés en base de données et injectés dynamiquement dans le contexte système (`system prompt`) d'Ollama lors des appels de génération (`/api/chat`).
* **Composition du prompt :** Le prompt final est assemblé par `backend/src/config/prompts.js` dans cet ordre :
  1. Le **rôle global AOC** (transverse à tous les agents).
  2. L'**identité et le rôle métier** de l'agent (nom d'affichage + `role`).
  3. Le **prompt spécifique** de l'agent (`systemPrompt`), complémentaire de la configuration par agent.
  4. Les **consignes de sortie** (langue, concision, structure).

---

## 3. Architecture Technique Globale (N-Tiers & Modulaire)
L'application repose sur une architecture 3-tiers découplée :
1. **Frontend (PWA) :** Interface utilisateur multiplateforme (Mac, Windows, Linux, iOS, Android) orientée composants modulaires.
2. **Backend (API Gateway / Service Layer) :** Serveur Node.js (Express) structuré en couches strictes (N-Tiers) faisant office de passerelle avec l'API Ollama.
3. **Database & Storage :** SQLite géré via Prisma ORM pour la persistance locale (configuration des agents, rôles, positions dans la grille pixel art, et historiques de discussions).

---

## 4. Architecture du Backend (Node.js / Express - N-Tiers)

### Structure des Dossiers Backend
```text
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── env.js            # Configuration centralisée des variables d'environnement
│   │   ├── prompts.js        # Rôle système global AOC + construction du prompt par agent
│   │   └── prisma.js         # Instance PrismaClient (singleton)
│   ├── controllers/
│   │   ├── agent.controller.js
│   │   └── chat.controller.js
│   ├── middlewares/
│   │   └── errorHandler.js   # Gestionnaire d'erreurs global
│   ├── repositories/
│   │   ├── agent.repository.js
│   │   └── conversation.repository.js
│   ├── routes/
│   │   ├── agent.routes.js
│   │   └── chat.routes.js
│   ├── services/
│   │   ├── ollama.service.js   # Communication avec l'API Ollama (streaming, timeouts)
│   │   ├── agent.service.js    # Logique métier des agents & synchronisation
│   │   └── chat.service.js     # Orchestration du chat (prompt, historique, streaming)
│   ├── utils/
│   │   └── ndjson.js           # Parseur NDJSON incrémental (robuste aux chunks coupés)
│   ├── app.js                # Configuration d'Express (middlewares, CORS, routes)
│   └── server.js             # Point d'entrée HTTP (écoute du port, arrêt propre)
├── tests/                    # Tests unitaires (node:test)
├── .env
└── package.json
```

### Schéma de Base de Données (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model AgentConfig {
  id           String        @id @default(uuid())
  modelName    String        @unique // Nom exact dans Ollama (ex: "llama3:latest")
  displayName  String?       // Nom personnalisé dans le bureau pixel art
  role         String?       // Rôle attribué (ex: "Développeur Senior", "Expert DevOps")
  systemPrompt String?       // Prompt système spécifique injecté au LLM pour ce rôle
  positionX    Int           @default(0) // Position X dans la grille pixel art
  positionY    Int           @default(0) // Position Y dans la grille pixel art
  avatarSprite String?       // Identifiant du sprite pixel art associé
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  conversations Conversation[]
}

model Conversation {
  id        String    @id @default(uuid())
  title     String    @default("Nouvelle discussion")
  agentId   String
  agent     AgentConfig @relation(fields: [agentId], references: [id], onDelete: Cascade)
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // "user" ou "assistant"
  content        String       // Contenu du message
  createdAt      DateTime     @default(now())
}
```

---

## 5. Architecture du Frontend (PWA - Vite / Vue 3 / TypeScript / Pinia)

### Structure des Dossiers Frontend (Feature-Driven)
```text
frontend/
├── public/
│   └── icons/                # Icônes de l'application (manifest généré par vite-plugin-pwa)
├── src/
│   ├── api/                  # Clients HTTP configurés (fetch wrapper typé)
│   ├── components/ui/        # Design System (Button, Card, Dialog, Badge, Tabs, MarkdownContent...)
│   ├── features/             # Organisation par grand domaine métier
│   │   ├── office/           # Vue du bureau pixel art et grille des agents
│   │   │   ├── components/   # PixelOfficeGrid, AgentDesk, AocMonitorView, OfficeToolbar...
│   │   │   ├── composables/  # Logique de la feature (useAgents)
│   │   │   └── services/     # Appels API de la vue bureau (agent.api)
│   │   └── chat/             # Interface de discussion avec un LLM (gestion du rôle actif)
│   │       ├── components/   # ChatWindow, MessageBubble, RoleSelector
│   │       ├── composables/  # Gestion du streaming des réponses (useChat)
│   │       └── services/     # Appels API du chat (chat.api)
│   ├── layout/               # Structure de l'application (MainLayout)
│   ├── lib/                  # Utilitaires purs (cn, rendu Markdown sécurisé)
│   ├── stores/               # Gestion d'état global (Pinia)
│   ├── styles/               # Styles globaux & Tailwind CSS
│   ├── types/                # Contrats TypeScript partagés (agent, chat)
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts            # Configuration Vite + Plugin PWA + proxy /api
└── package.json
```

### Fonctionnalités Spécifiques Implémentées
* **Grille pixel art positionnelle :** chaque agent occupe une case (`positionX`, `positionY`) de l'open-space. Les cases libres sont des bureaux vacants et le drag & drop permet de réorganiser le bureau (échange automatique des positions en cas de collision).
* **Terminal de discussion :** rendu Markdown sécurisé (`marked` + `DOMPurify`), blocs de code avec bouton « Copier », affichage du raisonnement interne des modèles *thinking* (Qwen3, DeepSeek R1...).
* **Moniteur HUD :** vue télémétrique de l'open-space (statuts, quantification, empreinte disque, historique).

---

## 6. Spécificités Techniques & Bonnes Pratiques
* **Communication Réseau :** 
  * Le backend communique avec Ollama (par défaut sur `http://localhost:11434`).
  * Configuration requise sur la machine hôte d'Ollama : `OLLAMA_ORIGINS="*"` et `OLLAMA_HOST="0.0.0.0"` pour permettre l'accès depuis la PWA sur le réseau local.
  * Le policy CORS accepte une liste d'origines (`CORS_ORIGIN` séparée par des virgules), autorise les origines *same-host* (accès direct à la PWA conteneurisée) et, en développement, les adresses loopback et réseau privé.
* **Streaming SSE robuste :** le flux NDJSON d'Ollama est décodé par un parseur incrémental (`backend/src/utils/ndjson.js`) qui reconstitue les objets JSON coupés par le réseau. Un *keep-alive* (`heartbeat`) est envoyé périodiquement et la génération est annulée si le client ferme l'onglet.
* **Séparation des Responsabilités :** Respect strict des couches (Route -> Controller -> Service -> Repository/ORM) pour garantir la maintenabilité et la testabilité du code. Les services acceptent leurs dépendances par injection pour permettre les tests unitaires.
* **Expérience PWA :** Utilisation de `vite-plugin-pwa` pour la mise en cache des assets et une installation fluide sur le bureau et le mobile.
* **Qualité :** suite de tests backend `node --test` (17 tests) exécutée par la CI GitHub Actions.