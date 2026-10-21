import { Router } from 'express';
import { networkService, NetworkService } from '../services/network.service.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * GET /api/system/network
 * Expose les adresses réseau de la machine afin de générer une URL
 * d'installation PWA joignable depuis un téléphone (QR code).
 */
router.get('/network', (req, res, next) => {
  try {
    const addresses = networkService.getLanAddresses();
    const primary = networkService.getPrimaryLanAddress();

    res.status(200).json({
      success: true,
      data: {
        addresses,
        primary,
        port: env.PORT,
        serveStatic: env.SERVE_STATIC,
        // L'adresse détectée est-elle celle du conteneur (inaccessible depuis
        // un smartphone) plutôt que celle de la machine hôte ?
        isContainerAddress: NetworkService.isContainerAddress(primary),
        hostLanIpConfigured: Boolean(env.HOST_LAN_IP),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
