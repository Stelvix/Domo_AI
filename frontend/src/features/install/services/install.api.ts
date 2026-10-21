import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/agent';

export interface NetworkAddress {
  interface: string;
  address: string;
  family: string;
}

export interface NetworkInfo {
  addresses: NetworkAddress[];
  primary: string | null;
  port: number;
  serveStatic: boolean;
  /** L'adresse détectée est celle du conteneur Docker (inaccessible depuis un téléphone). */
  isContainerAddress: boolean;
  /** L'IP LAN de la machine hôte a été fournie via HOST_LAN_IP. */
  hostLanIpConfigured: boolean;
}

export const systemApi = {
  /**
   * Récupère les adresses réseau de la machine (pour l'URL d'installation PWA)
   */
  async fetchNetworkInfo(): Promise<NetworkInfo> {
    const res = await apiClient.get<ApiResponse<NetworkInfo>>('/system/network');
    return res.data;
  },
};
