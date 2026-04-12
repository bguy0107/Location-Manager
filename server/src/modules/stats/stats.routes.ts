import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import { getDashboardStats } from './stats.controller';

export const statsRoutes = Router();

statsRoutes.get('/', authenticate, requireRole(Role.ADMIN, Role.MANAGER), getDashboardStats);
