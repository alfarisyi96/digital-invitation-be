import { Router } from 'express';
import { ResellerController } from '../controllers/ResellerController';
import { validateBody, validateQuery } from '../middleware/validation';
import { adminAuth } from '../middleware/auth';
import { createResellerSchema, updateResellerSchema, resellerQuerySchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// UUID validation schema for params
const uuidSchema = z.object({
  id: z.string().uuid('Invalid reseller ID format')
});

const referralCodeSchema = z.object({
  referral_code: z.string().min(3, 'Invalid referral code format')
});

/**
 * GET /admin/resellers
 * Get paginated list of resellers
 */
router.get('/', adminAuth, validateQuery(resellerQuerySchema), ResellerController.getResellers);

/**
 * POST /admin/resellers
 * Create new reseller
 */
router.post('/', adminAuth, validateBody(createResellerSchema), ResellerController.createReseller);

/**
 * GET /admin/resellers/referral/:referral_code
 * Get reseller by referral code
 */
router.get('/referral/:referral_code', adminAuth, ResellerController.getResellerByReferralCode);

/**
 * GET /admin/resellers/:id
 * Get reseller by ID
 */
router.get('/:id', adminAuth, ResellerController.getResellerById);

/**
 * PUT /admin/resellers/:id
 * Update reseller
 */
router.put('/:id', adminAuth, validateBody(updateResellerSchema), ResellerController.updateReseller);

/**
 * DELETE /admin/resellers/:id
 * Delete reseller
 */
router.delete('/:id', adminAuth, ResellerController.deleteReseller);

export default router;
