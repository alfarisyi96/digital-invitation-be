import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validateQuery } from '../middleware/validation';
import { adminAuth } from '../middleware/auth';
import { userQuerySchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// UUID validation schema for params
const uuidSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

/**
 * GET /admin/users
 * Get paginated list of users
 */
router.get('/', adminAuth, validateQuery(userQuerySchema), UserController.getUsers);

/**
 * GET /admin/users/stats
 * Get user statistics
 */
router.get('/stats', adminAuth, UserController.getUserStats);

/**
 * GET /admin/users/:id
 * Get user by ID
 */
router.get('/:id', adminAuth, UserController.getUserById);

export default router;
