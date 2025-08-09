import { Router } from 'express';
import { InvitationController } from '../controllers/InvitationControllerTest';
import { userAuth } from '../middleware/auth';

const router = Router();

// All routes require user authentication
router.use(userAuth);

// Invitation CRUD operations
router.post('/', InvitationController.create);
// router.get('/stats', InvitationController.getStats);
// router.get('/', InvitationController.list);
// router.get('/:id', InvitationController.getById);
// router.put('/:id', InvitationController.update);
// router.delete('/:id', InvitationController.delete);

// Status operations
// router.post('/:id/publish', InvitationController.publish);
// router.post('/:id/unpublish', InvitationController.unpublish);
// router.post('/:id/duplicate', InvitationController.duplicate);

export default router;
