import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, WELCOME_CREDITS, Role } from '../../../shared/types/index';

const SALT_ROUNDS = 10;

const formatUser = (user: { id: string; email: string; username: string; role: string; credits: number; createdAt: Date; updatedAt: Date }) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role as Role,
  credits: user.credits,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) throw new Error('Email or username already taken');

    const password = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: data.email, username: data.username, password, credits: WELCOME_CREDITS },
    });

    // Record welcome bonus transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'RECHARGE',
        amount: WELCOME_CREDITS,
        balance: WELCOME_CREDITS,
        description: '新用户注册赠送积分',
      },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      user: formatUser(user),
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      user: formatUser(user),
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true, credits: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new Error('User not found');
    return formatUser(user);
  }
}
