import { Router } from 'express';
import { InvitationController } from '../controllers/InvitationControllerTest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes (require authentication)
// All routes require authentication
router.use(authenticate);

// Test route
router.post('/', InvitationController.create);

export default router;
