import { Router } from 'express';

const router = Router();

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.json({ message: 'Public API is working' });
});

export default router;
