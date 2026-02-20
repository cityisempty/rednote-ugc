import { Router } from 'express';
import { generateOutline, generateNote, generateImage, analyzeNote, outlineValidation } from '../controllers/generateController';
import { authenticate } from '../middleware/auth';
import { generateLimiter } from '../middleware/rateLimiter';

const router = Router();
router.post('/outline', authenticate, generateLimiter, outlineValidation, generateOutline);
router.post('/note', authenticate, generateLimiter, generateNote);
router.post('/image', authenticate, generateLimiter, generateImage);
router.post('/analyze', authenticate, generateLimiter, analyzeNote);
export default router;
