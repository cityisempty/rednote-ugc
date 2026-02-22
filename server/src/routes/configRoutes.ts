// server/src/routes/configRoutes.ts
import { Router } from 'express';
import {
    getProviders,
    createProviderConfig,
    updateProviderConfig,
    deleteProviderConfig,
    activateProvider,
    testProvider
} from '../controllers/configController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/providers', getProviders);
router.post('/providers', createProviderConfig);
router.put('/providers/:id', updateProviderConfig);
router.delete('/providers/:id', deleteProviderConfig);
router.patch('/providers/:id/activate', activateProvider);
router.post('/test', testProvider);

export default router;
