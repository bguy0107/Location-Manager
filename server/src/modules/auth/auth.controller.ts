import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { loginSchema } from './auth.schemas';
import { UnauthorizedError } from '../../utils/errors';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(dto);

    res.cookie('refreshToken', refreshToken, authService.getRefreshTokenCookieOptions());

    res.json({ success: true, data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

    res.cookie('refreshToken', newRefreshToken, authService.getRefreshTokenCookieOptions());

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
