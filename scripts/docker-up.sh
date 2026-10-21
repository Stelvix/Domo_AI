#!/usr/bin/env bash
#
# Déploiement local de l'Agent Operations Center.
#
# Docker Compose n'execute pas de commande shell dans le fichier de
# composition : l'adresse IP LAN de la machine hote (indispensable au QR code
# d'installation PWA, car les interfaces du conteneur ne sont pas joignables
# depuis un smartphone) est donc detectee ici, puis injectee dans le conteneur.
#
# Usage :
#   npm run docker:up              # build + redemarrage
#   HOST_LAN_IP=192.168.1.20 npm run docker:up   # IP imposee
#
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Detection de l'adresse IP LAN de la machine hote ──────────────────────────
detect_lan_ip() {
  if [ -n "${HOST_LAN_IP:-}" ]; then
    echo "$HOST_LAN_IP"
    return
  fi

  local ip=""

  # macOS (interface Wi-Fi en priorite, puis Ethernet)
  if command -v ipconfig >/dev/null 2>&1; then
    for iface in en0 en1 en2; do
      ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
      if [ -n "$ip" ]; then
        echo "$ip"
        return
      fi
    done
  fi

  # Linux
  if command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    if [ -n "$ip" ]; then
      echo "$ip"
      return
    fi
  fi

  echo ""
}

LAN_IP="$(detect_lan_ip)"

if [ -n "$LAN_IP" ]; then
  export HOST_LAN_IP="$LAN_IP"
  echo "📡 IP LAN détectée : $HOST_LAN_IP"
else
  echo "⚠️  Impossible de détecter l'IP LAN : le QR code d'installation PWA pourra"
  echo "    proposer une adresse locale. Renseignez-la manuellement :"
  echo "    HOST_LAN_IP=<votre-ip> npm run docker:up"
fi

echo "🐳 Construction et démarrage du conteneur..."
docker compose up -d --build

echo ""
echo "✅ Ollama Pixel Office est déployé."
echo "   • Ordinateur : http://localhost:3001"
if [ -n "$LAN_IP" ]; then
  echo "   • Téléphone  : http://$LAN_IP:3001"
fi
echo "   • Logs       : npm run docker:logs"
