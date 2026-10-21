#!/bin/sh
set -e

echo "🚀 [AOC Production] Initialisation du conteneur Ollama Pixel Office..."

# Définition du chemin de base de données par défaut si absent
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/office.db"
fi

# Synchronisation du schéma SQLite avec Prisma
echo "📦 [AOC Production] Application du schéma Prisma sur SQLite ($DATABASE_URL)..."
npx prisma db push --schema=backend/prisma/schema.prisma --skip-generate

echo "✨ [AOC Production] Base de données prête. Démarrage de l'application..."
exec node backend/src/server.js
