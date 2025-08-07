import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { adminAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', adminAuth, DashboardController.getStats);

export default router;
