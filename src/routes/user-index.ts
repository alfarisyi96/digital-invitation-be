import { Router } from 'express';
import userAuthRoutes from './user-auth';
import userInvitationRoutes from './user-invitations';
import userTemplateRoutes from './user-templates';
import userPublicRoutes from './user-public';

const router = Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      service: 'User Dashboard API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    error: null
  });
});

// Mount route modules
router.use('/auth', userAuthRoutes);
router.use('/invitations', userInvitationRoutes);
router.use('/templates', userTemplateRoutes);
router.use('/public', userPublicRoutes);

export default router;
