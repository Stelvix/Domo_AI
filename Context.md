# CONTEXTE DU PROJET : Ollama Pixel Office (AOC - Agent Operations Center)

## 1. Vision Globale du Projet
Développer une application de bureau et mobile sous forme de **PWA (Progressive Web App)** permettant de piloter, visualiser et interagir avec des modèles d'intelligence artificielle locaux hébergés via **Ollama**. 
L'interface se veut ludique et immersive : chaque LLM détecté est représenté dans un espace de travail individuel (style "bureau en pixel art"), affichant son activité en temps réel, son état et ses interactions.

---

## 2. Rôle et Comportement du LLM (System Prompt / Persona)
Chaque agent IA configuré dans l'application peut se voir assigner un rôle métier spécifique. De plus, le système intègre un rôle global pour structurer les interactions :
* **Rôle Système Global :** Tu es un **Agent Operations Center (AOC)**, un superviseur technique et un assistant personnel intelligent et structuré. Ton rôle est d'aider l'utilisateur à orchestrer ses modèles locaux, à répondre avec précision, concision et efficacité, tout en adoptant la posture définie par son rôle attitré (ex: Développeur Senior, Rédacteur, DevOps, etc.).
* **Gestion des rôles par agent :** Les rôles et prompts système associés sont persistés en base de données et injectés dynamiquement dans le contexte système (`system prompt`) d'Ollama lors des appels de génération (`/api/chat`).

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
│   │   └── env.js            # Configuration centralisée des variables d'environnement
│   ├── controllers/
│   │   ├── agent.controller.js
│   │   └── chat.controller.js
│   ├── services/
│   │   ├── ollama.service.js   # Logique métier & communication avec l'API Ollama (injection des system prompts)
│   │   └── agent.service.js    # Logique métier des agents & gestion des données
│   ├── repositories/
│   │   └── agent.repository.js # Requêtes Prisma pures vers SQLite
│   ├── routes/
│   │   ├── agent.routes.js
│   │   └── chat.routes.js
│   ├── app.js                # Configuration d'Express (middlewares, CORS, routes)
│   └── server.js             # Point d'entrée HTTP (écoute du port)
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

## 5. Architecture du Frontend (PWA - Vite / React / TypeScript)

### Structure des Dossiers Frontend (Feature-Driven)
```text
frontend/
├── public/
│   ├── manifest.json         # Manifeste PWA pour installation native
│   └── icons/                # Icônes de l'application
├── src/
│   ├── api/                  # Clients HTTP configurés (fetch/axios)
│   ├── components/           # Composants UI globaux réutilisables (Design System)
│   ├── features/             # Organisation par grand domaine métier
│   │   ├── office/           # Vue du bureau pixel art et grille des agents
│   │   │   ├── components/   # PixelOfficeGrid, AgentDesk
│   │   │   ├── hooks/        # Hooks spécifiques (ex: animations, états des agents)
│   │   │   └── services/     # Appels API de la vue bureau
│   │   └── chat/             # Interface de discussion avec un LLM (gestion du rôle actif)
│   │       ├── components/   # ChatWindow, MessageBubble, RoleSelector
│   │       └── hooks/        # Gestion du streaming des réponses
│   ├── layout/               # Structure de l'application (Navbar, Sidebar, MainLayout)
│   ├── router/               # Configuration des routes (React Router)
│   ├── store/                # Gestion d'état global (Zustand / Context)
│   ├── styles/               # Styles globaux & Tailwind CSS
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js            # Configuration Vite + Plugin PWA
└── package.json
```

---

## 6. Spécificités Techniques & Bonnes Pratiques
* **Communication Réseau :** 
  * Le backend communique avec Ollama (par défaut sur `http://localhost:11434`).
  * Configuration requise sur la machine hôte d'Ollama : `OLLAMA_ORIGINS="*"` et `OLLAMA_HOST="0.0.0.0"` pour permettre l'accès depuis la PWA sur le réseau local.
* **Séparation des Responsabilités :** Respect strict des couches (Route -> Controller -> Service -> Repository/ORM) pour garantir la maintenabilité et la testabilité du code.
* **Expérience PWA :** Utilisation de `vite-plugin-pwa` pour la mise en cache des assets et une installation fluide sur le bureau et le mobile.