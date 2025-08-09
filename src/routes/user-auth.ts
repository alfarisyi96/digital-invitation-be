import { Router } from 'express';
import { UserAuthService } from '../services/UserAuthService';
import { userAuth } from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/login/google', UserAuthService.loginWithGoogle);
router.post('/logout', UserAuthService.logout);

// Protected routes
router.get('/profile', userAuth, UserAuthService.getProfile);

export default router;
