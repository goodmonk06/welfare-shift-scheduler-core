import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * GET /api/health
 * ヘルスチェック
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const stats = await storage.getStats();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      storage: stats,
    });
  })
);

export default router;
