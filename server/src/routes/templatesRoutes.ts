import { Router } from 'express';
import { getTemplates, getTemplate, createTemplate } from '../controllers/templatesController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getTemplates);
router.get('/:id', authenticate, getTemplate);
router.post('/', authenticate, createTemplate);
export default router;
