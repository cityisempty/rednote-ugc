import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';

const authService = new AuthService();

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('请输入有效的邮箱'),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名3-20位，仅限字母数字下划线'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('请输入有效的邮箱'),
  body('password').notEmpty().withMessage('请输入密码'),
];

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { sendError(res, errors.array()[0].msg, 400); return; }
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, '注册成功', 201);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { sendError(res, errors.array()[0].msg, 400); return; }
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, '登录成功');
  } catch (e: unknown) { sendError(res, (e as Error).message, 401); }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (e: unknown) { sendError(res, (e as Error).message, 404); }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { sendError(res, 'Refresh token required', 400); return; }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
    sendSuccess(res, { accessToken });
  } catch {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, null, '已退出登录');
};
