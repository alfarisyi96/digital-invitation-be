import { Router } from 'express';
import { InvitationController } from '../controllers/InvitationControllerTest';
import { authenticate } from '../middleware/auth';

const router = Router();

// Invitation CRUD operations
router.post('/', InvitationController.create);

export default router;
