import { Router } from 'express';
import { networkService } from '../services/network.service.js';
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

    res.status(200).json({
      success: true,
      data: {
        addresses,
        primary: networkService.getPrimaryLanAddress(),
        port: env.PORT,
        serveStatic: env.SERVE_STATIC,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
