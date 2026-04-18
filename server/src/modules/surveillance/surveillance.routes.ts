import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './surveillance.controller';

export const surveillanceRoutes = Router();

surveillanceRoutes.use(authenticate);

// All authenticated users can list and create
surveillanceRoutes.get('/', controller.listRequests);
surveillanceRoutes.get('/:id', controller.getRequest);
surveillanceRoutes.post('/', controller.createRequest);

// Only MANAGER and ADMIN can update status
surveillanceRoutes.patch(
  '/:id',
  requireRole(Role.ADMIN, Role.MANAGER),
  controller.updateStatus
);

// Only ADMIN can delete
surveillanceRoutes.delete('/:id', requireRole(Role.ADMIN), controller.deleteRequest);
