import { Router } from 'express';
import { getStats, getUsers, updateUser } from '../controllers/adminController';
import { generateCards, listCards } from '../controllers/rechargeController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.post('/cards/generate', generateCards);
router.get('/cards', listCards);
export default router;
