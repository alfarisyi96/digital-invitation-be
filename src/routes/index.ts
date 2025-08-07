import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import resellerRoutes from './resellers';
import inviteRoutes from './invites';
import dashboardRoutes from './dashboard';

const router = Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    error: null
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/resellers', resellerRoutes);
router.use('/invites', inviteRoutes);

export default router;
