import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { generateService } from '../services/generateService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const outlineValidation = [
  body('name').notEmpty().withMessage('产品名称不能为空'),
  body('audience').notEmpty().withMessage('目标受众不能为空'),
  body('description').notEmpty().withMessage('产品描述不能为空'),
  body('features').notEmpty().withMessage('核心功能不能为空'),
  body('style').notEmpty().withMessage('风格不能为空'),
];

export const generateOutline = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { sendError(res, errors.array()[0].msg, 400); return; }
  try {
    const result = await generateService.generateOutline(req.user!.userId, req.body);
    sendSuccess(res, result);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const generateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { outline, productInfo } = req.body;
  if (!outline || !productInfo) { sendError(res, '请提供大纲和产品信息', 400); return; }
  try {
    const result = await generateService.generateNote(req.user!.userId, outline, productInfo);
    sendSuccess(res, result);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const generateImage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { prompt, noteId } = req.body;
  if (!prompt) { sendError(res, '请提供图片描述', 400); return; }
  try {
    const result = await generateService.generateImage(req.user!.userId, prompt, noteId);
    sendSuccess(res, result);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const analyzeNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { content } = req.body;
  if (!content) { sendError(res, '请提供笔记内容', 400); return; }
  try {
    const result = await generateService.analyzeNote(req.user!.userId, content);
    sendSuccess(res, result);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
