import os from 'os';
import { env } from '../config/env.js';

/**
 * Service d'introspection réseau.
 *
 * La PWA doit être installable depuis un téléphone : l'URL encodée dans le QR
 * code doit donc pointer vers l'adresse IP LAN de la machine (et non
 * "localhost", inaccessible depuis un autre appareil).
 *
 * Attention en conteneur : les interfaces du conteneur (172.17.x.x) ne sont pas
 * joignables depuis un téléphone. L'IP LAN de la machine hôte est donc
 * prioritaire via la variable d'environnement `HOST_LAN_IP` (injectée par
 * docker-compose).
 */
export class NetworkService {
  /**
   * Retourne les adresses IPv4 non loopback de la machine.
   * @returns {{ interface: string, address: string, family: string }[]}
   */
  getLanAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const [name, entries] of Object.entries(interfaces)) {
      for (const entry of entries || []) {
        // Node >= 18 expose `family` sous forme de chaîne, avant sous forme de nombre.
        const isIPv4 = entry.family === 'IPv4' || entry.family === 4;
        if (!isIPv4 || entry.internal) continue;

        addresses.push({
          interface: name,
          address: entry.address,
          family: 'IPv4',
        });
      }
    }

    return addresses;
  }

  /**
   * Indique si une adresse appartient au réseau bridge de Docker
   * (172.16.0.0/12), donc inaccessible depuis un smartphone.
   *
   * @param {string | null} address
   * @returns {boolean}
   */
  static isContainerAddress(address) {
    if (!address) return false;
    const match = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(address);
    if (!match) return false;
    const secondOctet = Number.parseInt(match[1], 10);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  /**
   * Adresse LAN joignable depuis un téléphone.
   *
   * Priorité à `HOST_LAN_IP` (IP de la machine hôte, seule joignable depuis le
   * réseau when l'API tourne dans un conteneur), puis aux interfaces détectées.
   *
   * @returns {string | null}
   */
  getPrimaryLanAddress() {
    if (env.HOST_LAN_IP) {
      return env.HOST_LAN_IP;
    }

    const addresses = this.getLanAddresses();
    return addresses.length > 0 ? addresses[0].address : null;
  }
}

export const networkService = new NetworkService();
