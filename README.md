# Ollama Pixel Office (AOC - Agent Operations Center)

> **Superviseur technique et centre d'opérations pour modèles d'intelligence artificielle locaux hébergés via Ollama, dans un univers immersif en Pixel Art.**

Conçu sous la forme d'une **PWA (Progressive Web App)** moderne et responsive (Desktop, Tablette, Mobile iOS & Android), **Ollama Pixel Office** permet de détecter, configurer et interagir en temps réel avec vos LLMs locaux grâce à une architecture N-Tiers robuste et découplée.

---

## 🌟 Fonctionnalités Clés

* **🏢 Bureau Virtuel Pixel Art :** Chaque modèle Ollama détecté dispose de son propre poste de travail animé (état en direct : *En ligne*, *En réflexion*, *Hors-ligne*).
* **💬 Terminal de Discussion & Streaming SSE :** Échanges instantanés en streaming temps réel via **Server-Sent Events (SSE)** avec support du formatage markdown et copie de code.
* **🎭 Injection Dynamique de Rôles Métier :** Personnalisation des rôles (*Lead Développeur*, *Expert DevOps*, *Auditeur de Code*, etc.) et injection automatique du prompt système dans Ollama lors des inférences.
* **🔄 Synchronisation Automatique avec Ollama :** Détection des nouveaux modèles téléchargés (`ollama pull`) et import automatique en un clic.
* **📱 Progressive Web App (PWA) :** Installable sur mobile et bureau, mode plein écran, mise en cache hors-ligne via Workbox et Service Workers.
* **🐳 Déploiement Conteneurisé Production-Ready :** Image Docker multi-stage optimisée sous Alpine Linux avec orchestration `docker-compose`.
* **⚙️ Pipeline CI/CD Complète :** Intégration continue GitHub Actions validant le typage statique, Prisma et la construction de l'image Docker.

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

---

## 🐳 Déploiement en Production via Docker

Le projet intègre un conteneur unifié servant à la fois l'API et la PWA statique pré-compilée sur un port unique.

```bash
# Démarrer le conteneur en arrière-plan
docker compose up --build -d

# Vérifier les logs de fonctionnement
docker compose logs -f
```

L'application est disponible immédiatement sur : **`http://localhost:3001`**.

> **Note Réseau Docker :** Le conteneur utilise `host.docker.internal:host-gateway` pour communiquer directement avec l'instance Ollama de votre machine hôte (`http://host.docker.internal:11434`).

---

## 🛠️ Commandes Disponibles (Scripts NPM)

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lance le backend et le frontend en parallèle |
| `npm run dev:backend` | Démarre le serveur Express en mode nodemon |
| `npm run dev:frontend` | Démarre le serveur Vite en mode développement |
| `npm run build` | Compile la PWA frontend avec vérification TypeScript (`vue-tsc`) |
| `npm run prisma:push` | Synchronise le schéma Prisma avec la base de données SQLite |
| `npm run prisma:studio` | Ouvre l'interface graphique Prisma Studio pour visualiser les données |

---

## 📋 Variables d'Environnement

Le fichier `.env` du backend (`backend/.env`) supporte les variables suivantes :

```env
PORT=3001
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
SERVE_STATIC="false"
```

---

## 🔄 Pipeline CI/CD

Le workflow GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) s'exécute automatiquement sur `push` et `pull_request` :
1. **Validation Backend :** Validation du schéma Prisma, génération du client ORM et vérification syntaxique du serveur Node.js.
2. **Validation Frontend :** Type-check TypeScript strict (`vue-tsc --noEmit`), build Vite et validation du Service Worker PWA.
3. **Build Docker :** Validation de la construction de l'image de production multi-stage avec cache GHA.
