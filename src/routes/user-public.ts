import { Router } from 'express';

const router = Router();

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    data: { message: 'Public API is working' },
    error: null
  });
});

// Will add invitation public viewing here later
// router.get('/invitations/:slug', InvitationController.getBySlug);

export default router;
