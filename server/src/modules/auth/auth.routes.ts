import { Router } from 'express';
import { loginController, refreshController, logoutController } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit';

export const authRoutes = Router();

authRoutes.post('/login', authLimiter, loginController);
authRoutes.post('/refresh', refreshController);
authRoutes.post('/logout', logoutController);
