import { Response } from 'express';
import { ApiResponse } from '../../../shared/types/index';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400
): Response => {
  const response: ApiResponse = { success: false, error };
  return res.status(statusCode).json(response);
};
