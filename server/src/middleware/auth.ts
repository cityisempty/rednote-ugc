import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401);
      return;
    }
    req.user = verifyAccessToken(authHeader.substring(7));
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    sendError(res, 'Admin access required', 403);
    return;
  }
  next();
};
