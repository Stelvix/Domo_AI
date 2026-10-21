# Ollama Pixel Office (AOC - Agent Operations Center)

> **Superviseur technique et centre d'opérations pour modèles d'intelligence artificielle locaux hébergés via Ollama, dans un univers immersif en Pixel Art.**

Conçu sous la forme d'une **PWA (Progressive Web App)** moderne et responsive (Desktop, Tablette, Mobile iOS & Android), **Ollama Pixel Office** permet de détecter, configurer et interagir en temps réel avec vos LLMs locaux grâce à une architecture N-Tiers robuste et découplée.

---

## 🌟 Fonctionnalités Clés

* **🏢 Bureau Virtuel Pixel Art Positionnel :** chaque modèle Ollama détecté occupe un poste de travail sur une grille d'open-space (état en direct : *En ligne*, *En réflexion*, *Hors-ligne*). Glissez-déposez les agents d'un bureau à l'autre pour réorganiser l'espace de travail (les positions sont persistées en base).
* **➕ Création d'Assistant depuis l'Interface :** installez un nouvel assistant en quelques clics : choix du modèle Ollama, nom d'affichage, rôle métier (préréglages Dev / DevOps / Code Reviewer / Rédacteur), sprite pixel art et prompt système. Le bureau libre est attribué automatiquement.
* **📲 Installation PWA par QR Code :** le bouton « Installer » affiche un QR code de l'URL d'installation (adresse IP réseau local) à scanner avec votre téléphone, accompagné des procédures iOS / Android / desktop.
* **💬 Terminal de Discussion & Streaming SSE :** échanges instantanés en streaming temps réel via **Server-Sent Events (SSE)** avec support du formatage **Markdown**, **copie de code** en un clic et affichage du **raisonnement interne** des modèles *thinking* (Qwen3, DeepSeek R1...).
* **🎭 Injection Dynamique de Rôles Métier :** personnalisation des rôles (*Lead Développeur*, *Expert DevOps*, *Auditeur de Code*, etc.) et injection automatique d'un prompt système composite (rôle global AOC + rôle métier + prompt spécifique) dans Ollama lors des inférences.
* **🔄 Synchronisation Automatique avec Ollama :** détection des nouveaux modèles téléchargés (`ollama pull`) et import automatique en un clic, sans jamais écraser votre configuration personnalisée.
* **📱 Progressive Web App (PWA) :** installable sur mobile et bureau, mode plein écran, mise en cache hors-ligne via Workbox et Service Workers.
* **🛡️ Streaming Robuste :** parseur NDJSON incrémental (aucun contenu perdu si le réseau coupe un chunk), keep-alive SSE pendant le chargement du modèle et annulation propre de la génération à la fermeture de l'onglet.
* **🐳 Déploiement Conteneurisé Production-Ready :** image Docker multi-stage optimisée sous Alpine Linux avec orchestration `docker-compose`.
* **🧪 Pipeline CI/CD Complète :** intégration continue GitHub Actions validant le typage statique, les tests unitaires backend, Prisma et la construction de l'image Docker.

---

## 🏗️ Architecture Technique

### 1. Backend N-Tiers (Node.js / Express / Prisma / SQLite)
```text
HTTP Request (REST / SSE)
     │
     ▼
Routes (`src/routes/`)
     │ (Délégation pure, zéro logique métier)
     ▼
Controllers (`src/controllers/`)
     │ (Validation, négociation HTTP & SSE, codes d'état)
     ▼
Services Métier (`src/services/`)
     │ (Injection de prompt système, streaming NDJSON Ollama, enrichissement d'état)
     ▼
Repositories (`src/repositories/`)
     │ (Requêtes Prisma pures)
     ▼
Prisma ORM & SQLite (`prisma/schema.prisma`)
```

### 2. Frontend Feature-Driven (Vue 3 / TypeScript / Pinia / Tailwind CSS)
* **Organisation par domaines métier :** `features/office` (grille, bureaux, configuration) et `features/chat` (streaming, historique, bulles de discussion).
* **Séparation stricte UI / Logique :** Composants de présentation pilotés par des composables dédiés (`useAgents`, `useChat`) connectés aux stores Pinia.

---

## 🚀 Démarrage Rapide

### Prérequis
1. **Node.js :** Version 20+ ou 22 LTS
2. **Ollama :** Installé et en cours d'exécution sur votre machine :
   ```bash
   ollama serve
   ```
   *(Assurez-vous d'avoir téléchargé au moins un modèle, par exemple : `ollama pull llama3:8b`)*

### 1. Installation en Mode Développement

```bash
# Cloner le dépôt et entrer dans le dossier
git clone <url_du_repo>
cd "IA gen test"

# Installer les dépendances du monorepo
npm install

# Initialiser la base de données locale SQLite
npm run prisma:push

# Lancer simultanément le Backend (port 3001) et le Frontend (port 5173)
npm run dev
```

* **Frontend :** Ouvrez votre navigateur sur `http://localhost:5173`
* **Backend API :** Accessible sur `http://localhost:3001/api/health`

> **Accès mobile (PWA) :** le serveur Vite écoute sur toutes les interfaces réseau. Depuis votre smartphone, ouvrez `http://<ip-de-votre-pc>:5173` puis installez l'application via le menu du navigateur. En développement, les origines du réseau local sont automatiquement autorisées par la politique CORS.

---

## 🐳 Déploiement en Production via Docker

Le projet intègre un conteneur unifié servant à la fois l'API et la PWA statique pré-compilée sur un port unique.

```bash
# Détecte l'IP LAN de la machine, construit l'image et démarre le conteneur
npm run docker:up

# Consulter les logs en temps réel
npm run docker:logs

# Arrêter le conteneur
npm run docker:down
```

L'application est disponible immédiatement sur : **`http://localhost:3001`**,
et depuis votre téléphone sur **`http://<votre-ip-lan>:3001`**.

> **Pourquoi un script ?** Docker Compose n'exécute pas de commande shell dans le
> fichier de composition. `scripts/docker-up.sh` détecte donc l'IP LAN de la
> machine (`ipconfig getifaddr` sur macOS, `hostname -I` sur Linux) et l'injecte
> dans le conteneur via `HOST_LAN_IP`. C'est cette adresse qui est encodée dans le
> QR code d'installation PWA : les interfaces du conteneur (`172.17.x.x`) ne sont
> pas joignables depuis un smartphone.
> Surcharge possible : `HOST_LAN_IP=192.168.1.20 npm run docker:up`.

> **Note Réseau Docker :** Le conteneur utilise `host.docker.internal:host-gateway` pour communiquer directement avec l'instance Ollama de votre machine hôte (`http://host.docker.internal:11434`).
>
> **Persistance :** les données (agents, conversations) sont stockées dans le volume Docker `iagentest_aoc_data` et survivent aux redémarrages.

---

## 🛠️ Commandes Disponibles (Scripts NPM)

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lance le backend et le frontend en parallèle |
| `npm run dev:backend` | Démarre le serveur Express en mode nodemon |
| `npm run dev:frontend` | Démarre le serveur Vite en mode développement |
| `npm run build` | Compile la PWA frontend avec vérification TypeScript (`vue-tsc`) |
| `npm test` | Exécute la suite de tests unitaires backend (`node --test`) |
| `npm run prisma:push` | Synchronise le schéma Prisma avec la base de données SQLite |
| `npm run prisma:studio` | Ouvre l'interface graphique Prisma Studio pour visualiser les données |
| `npm run docker:up` | Détecte l'IP LAN, construit l'image et démarre le conteneur de production |
| `npm run docker:logs` | Affiche les logs du conteneur en temps réel |
| `npm run docker:down` | Arrête et supprime le conteneur |

---

## 🔌 API Backend

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | État de l'API + joignabilité et version d'Ollama |
| `GET` | `/api/agents` | Liste des agents avec statut et métadonnées du modèle |
| `POST` | `/api/agents` | Crée un nouvel assistant (modèle Ollama + rôle métier) |
| `POST` | `/api/agents/sync` | Synchronise les modèles Ollama (import non destructif) |
| `GET` | `/api/agents/:id` | Détails d'un agent |
| `PUT` | `/api/agents/:id` | Met à jour rôle, prompt, sprite et position |
| `PATCH` | `/api/agents/:id/position` | Déplace un agent sur la grille (échange si occupé) |
| `DELETE` | `/api/agents/:id` | Retire un agent du bureau (cascade sur les conversations) |
| `POST` | `/api/chat` | Envoi d'un message — réponse en streaming SSE |
| `GET` | `/api/chat/conversations/agent/:agentId` | Historique des discussions d'un agent |
| `POST` | `/api/chat/conversations` | Crée une nouvelle conversation |
| `GET` | `/api/chat/conversations/:id/messages` | Messages d'une conversation |
| `DELETE` | `/api/chat/conversations/:id` | Supprime une conversation |
| `GET` | `/api/ollama/models` | Modèles Ollama installés + état d'affectation aux agents |
| `GET` | `/api/system/network` | Adresses IP LAN (URL d'installation PWA pour le QR code) |

---

## 📋 Variables d'Environnement

Le fichier `.env` du backend (`backend/.env`) supporte les variables suivantes :

```env
PORT=3001
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
CORS_ORIGIN="http://localhost:5173"   # Liste d'origines séparées par des virgules
NODE_ENV="development"
SERVE_STATIC="false"
OLLAMA_TIMEOUT_MS=600000               # Timeout de génération (chargement du modèle inclus)
SSE_HEARTBEAT_INTERVAL_MS=15000        # Intervalle des keep-alive SSE
CHAT_HISTORY_LIMIT=20                  # Messages d'historique réinjectés dans le contexte
OFFICE_GRID_COLUMNS=4                  # Colonnes de la grille pixel art
HOST_LAN_IP="192.168.1.20"             # IP LAN de la machine hôte (QR code PWA, requis en conteneur)
```

> **Note conteneur :** l'IP LAN de la machine hôte est détectée automatiquement par
> `scripts/docker-up.sh` (`npm run docker:up`) et injectée dans `HOST_LAN_IP`.
> Elle est indispensable au QR code d'installation : les interfaces du
> conteneur (`172.17.x.x`) ne sont pas joignables depuis un smartphone.
> Surcharge possible : `HOST_LAN_IP=192.168.1.20 npm run docker:up`.

---

## 🔄 Pipeline CI/CD

Le workflow GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) s'exécute automatiquement sur `push` et `pull_request` :
1. **Validation Backend :** validation du schéma Prisma, génération du client ORM, exécution de la suite de tests unitaires (`npm test`) et vérification syntaxique du serveur Node.js.
2. **Validation Frontend :** type-check TypeScript strict (`vue-tsc --noEmit`), build Vite et validation du Service Worker PWA.
3. **Build Docker :** validation de la construction de l'image de production multi-stage avec cache GHA.
