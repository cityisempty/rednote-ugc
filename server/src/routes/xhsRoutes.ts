import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  checkXhsLogin,
  getXhsQrcode,
  logoutXhs,
  listXhsFeeds,
  searchXhsFeeds,
  getXhsFeedDetail,
  getMyXhsProfile,
  publishToXhs,
  likeXhsFeed,
  favoriteXhsFeed,
  commentOnXhsFeed,
} from '../controllers/xhsController';

const router = Router();

router.use(authenticate);

router.get('/login/status', checkXhsLogin);
router.get('/login/qrcode', getXhsQrcode);
router.delete('/login', logoutXhs);
router.get('/feeds', listXhsFeeds);
router.post('/feeds/search', searchXhsFeeds);
router.post('/feeds/detail', getXhsFeedDetail);
router.get('/profile/me', getMyXhsProfile);
router.post('/publish', publishToXhs);
router.post('/feeds/like', likeXhsFeed);
router.post('/feeds/favorite', favoriteXhsFeed);
router.post('/feeds/comment', commentOnXhsFeed);

export default router;
