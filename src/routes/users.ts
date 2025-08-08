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
 * POST /admin/users
 * Create a new user
 */
router.post('/', adminAuth, UserController.createUser);

/**
 * GET /admin/users/:id
 * Get user by ID
 */
router.get('/:id', adminAuth, UserController.getUserById);

/**
 * PUT /admin/users/:id
 * Update user by ID
 */
router.put('/:id', adminAuth, UserController.updateUser);

/**
 * DELETE /admin/users/:id
 * Delete user by ID
 */
router.delete('/:id', adminAuth, UserController.deleteUser);

export default router;
