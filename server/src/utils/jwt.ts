import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const getSecret = () => process.env.JWT_SECRET!;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET!;
const getExpiresIn = () => (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const getRefreshExpiresIn = () => (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export const generateAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, getSecret(), { expiresIn: getExpiresIn() });

export const generateRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, getRefreshSecret(), { expiresIn: getRefreshExpiresIn() });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, getSecret()) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, getRefreshSecret()) as JwtPayload;
