import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  sendError(res, message, status);
};
