import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './users.controller';

export const usersRoutes = Router();

// All routes require authentication
usersRoutes.use(authenticate);

// GET /api/users/me — any authenticated user can get their own profile
usersRoutes.get('/me', controller.getMe);

// Routes restricted to ADMIN and MANAGER
usersRoutes.get('/', requireRole(Role.ADMIN, Role.MANAGER), controller.listUsers);
usersRoutes.post('/', requireRole(Role.ADMIN, Role.MANAGER), controller.createUser);

usersRoutes
  .route('/:id')
  .get(requireRole(Role.ADMIN, Role.MANAGER), controller.getUser)
  .put(requireRole(Role.ADMIN, Role.MANAGER), controller.updateUser)
  .delete(requireRole(Role.ADMIN), controller.deleteUser); // Only ADMIN can delete
