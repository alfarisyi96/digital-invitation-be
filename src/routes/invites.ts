import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { validateQuery } from '../middleware/validation';
import { adminAuth } from '../middleware/auth';
import { inviteQuerySchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas for params
const uuidSchema = z.object({
  id: z.string().uuid('Invalid invite ID format')
});

const slugSchema = z.object({
  slug: z.string().min(1, 'Invalid slug format')
});

/**
 * GET /admin/invites
 * Get paginated list of invites
 */
router.get('/', adminAuth, validateQuery(inviteQuerySchema), InviteController.getInvites);

/**
 * GET /admin/invites/stats
 * Get invite statistics
 */
router.get('/stats', adminAuth, InviteController.getInviteStats);

/**
 * GET /admin/invites/slug/:slug
 * Get invite by slug
 */
router.get('/slug/:slug', adminAuth, InviteController.getInviteBySlug);

/**
 * GET /admin/invites/:id
 * Get invite by ID
 */
router.get('/:id', adminAuth, InviteController.getInviteById);

/**
 * DELETE /admin/invites/:id
 * Delete invite (admin only)
 */
router.delete('/:id', adminAuth, InviteController.deleteInvite);

export default router;
