import { Response } from 'express';
import { xhsMcpClient } from '../services/xhsMcpClient';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const checkXhsLogin = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await xhsMcpClient.checkLoginStatus();
    sendSuccess(res, status);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const getXhsQrcode = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await xhsMcpClient.getLoginQrcode();
    sendSuccess(res, result);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const logoutXhs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await xhsMcpClient.deleteCookies();
    sendSuccess(res, null, '已退出小红书登录');
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const listXhsFeeds = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feeds = await xhsMcpClient.listFeeds();
    sendSuccess(res, feeds);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const searchXhsFeeds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keyword, sort_by, note_type, publish_time } = req.body;
    if (!keyword) { sendError(res, '关键词不能为空'); return; }
    const feeds = await xhsMcpClient.searchFeeds({ keyword, sort_by, note_type, publish_time });
    sendSuccess(res, feeds);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const getXhsFeedDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feed_id, xsec_token } = req.body;
    if (!feed_id || !xsec_token) { sendError(res, '缺少必要参数'); return; }
    const detail = await xhsMcpClient.getFeedDetail(feed_id, xsec_token);
    sendSuccess(res, detail);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const getMyXhsProfile = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await xhsMcpClient.checkLoginStatus();
    if (!status.logged_in) { sendError(res, '未登录小红书', 401); return; }
    const feeds = await xhsMcpClient.listFeeds();
    sendSuccess(res, { username: status.username, feeds });
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const publishToXhs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, images, tags } = req.body;
    if (!title || !content) { sendError(res, '标题和内容不能为空'); return; }
    if (title.length > 20) { sendError(res, '标题不能超过20个字符'); return; }
    if (content.length > 1000) { sendError(res, '内容不能超过1000个字符'); return; }

    const resolvedImages = (images || []).map((img: string) => {
      if (img.startsWith('http')) return img;
      const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
    });

    const result = await xhsMcpClient.publishContent({
      title,
      content,
      images: resolvedImages,
      tags,
    });
    sendSuccess(res, result);
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const likeXhsFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feed_id, xsec_token } = req.body;
    if (!feed_id || !xsec_token) { sendError(res, '缺少必要参数'); return; }
    await xhsMcpClient.likeFeed(feed_id, xsec_token);
    sendSuccess(res, null, '点赞成功');
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const favoriteXhsFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feed_id, xsec_token } = req.body;
    if (!feed_id || !xsec_token) { sendError(res, '缺少必要参数'); return; }
    await xhsMcpClient.favoriteFeed(feed_id, xsec_token);
    sendSuccess(res, null, '收藏成功');
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};

export const commentOnXhsFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feed_id, xsec_token, content } = req.body;
    if (!feed_id || !xsec_token || !content) { sendError(res, '缺少必要参数'); return; }
    await xhsMcpClient.postComment(feed_id, xsec_token, content);
    sendSuccess(res, null, '评论成功');
  } catch (e: unknown) {
    sendError(res, (e as Error).message, 500);
  }
};
