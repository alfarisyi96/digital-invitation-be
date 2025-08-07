import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middleware/validation';
import { adminAuth } from '../middleware/auth';
import { loginSchema, createAdminSchema } from '../utils/validation';

const router = Router();

/**
 * POST /admin/auth/login
 * Admin user login with HTTP-only cookie
 */
router.post('/login', validateBody(loginSchema), AuthController.login);

/**
 * POST /admin/auth/logout
 * Admin user logout - clear HTTP-only cookie
 */
router.post('/logout', AuthController.logout);

/**
 * GET /admin/auth/me
 * Get current admin user info
 */
router.get('/me', adminAuth, AuthController.me);

/**
 * POST /admin/auth/create-admin
 * Create new admin user (requires admin auth)
 */
router.post('/create-admin', adminAuth, validateBody(createAdminSchema), AuthController.createAdmin);

/**
 * POST /admin/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', adminAuth, AuthController.refreshToken);

export default router;
