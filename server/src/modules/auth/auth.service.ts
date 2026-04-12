import bcrypt from 'bcrypt';
import { prisma } from '../../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';
import { config } from '../../config';
import { Role } from '../../types';
import { LoginDto } from './auth.schemas';

// Strip password from user object before returning
function sanitizeUser(user: { id: string; name: string; email: string; role: Role; isActive: boolean }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.password);
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
  });

  const refreshTokenValue = signRefreshToken({ sub: user.id });

  // Persist refresh token (15 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15);

  await prisma.refreshToken.create({
    data: { token: refreshTokenValue, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken: refreshTokenValue, user: sanitizeUser({ ...user, role: user.role as Role }) };
}

export async function refresh(refreshTokenValue: string) {
  // Verify the JWT signature first
  const payload = verifyRefreshToken(refreshTokenValue);

  // Check it exists in DB and is not expired
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  });

  if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (!stored.user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { token: refreshTokenValue } });

  const newAccessToken = signAccessToken({
    sub: stored.user.id,
    email: stored.user.email,
    role: stored.user.role as Role,
  });

  const newRefreshToken = signRefreshToken({ sub: stored.user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15);

  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: stored.user.id, expiresAt },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshTokenValue: string) {
  // Delete specific token (ignore if already gone)
  await prisma.refreshToken.deleteMany({ where: { token: refreshTokenValue } });
}

export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in ms
    path: '/',
  };
}
