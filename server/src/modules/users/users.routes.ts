import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './users.controller';

export const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.get('/me', controller.getMe);

usersRoutes.get(
  '/',
  requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER, Role.TECHNICIAN),
  controller.listUsers,
);
usersRoutes.post('/', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER), controller.createUser);

usersRoutes
  .route('/:id')
  .get(requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER, Role.TECHNICIAN), controller.getUser)
  .put(requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER), controller.updateUser)
  .delete(requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.deleteUser);
