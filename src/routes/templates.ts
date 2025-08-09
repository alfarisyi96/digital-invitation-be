import { Router } from 'express';
import { TemplateController } from '../controllers/TemplateController';

const router = Router();

// Public template routes (no authentication required)
router.get('/popular', TemplateController.getPopular);
router.get('/categories', TemplateController.getCategoriesWithCounts);
router.get('/styles', TemplateController.getStylesWithCounts);
router.get('/search', TemplateController.search);
router.get('/category/:category', TemplateController.getByCategory);
router.get('/premium', TemplateController.getPremium);
router.get('/:id/related', TemplateController.getRelated);
router.get('/:id', TemplateController.getById);
router.get('/', TemplateController.list);

export default router;
