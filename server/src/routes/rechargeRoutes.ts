import { Router } from 'express';
import { redeem, generateCards, listCards, redeemValidation } from '../controllers/rechargeController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.post('/redeem', authenticate, redeemValidation, redeem);
router.post('/generate', authenticate, requireAdmin, generateCards);
router.get('/cards', authenticate, requireAdmin, listCards);
export default router;
