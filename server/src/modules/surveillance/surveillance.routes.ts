import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './surveillance.controller';

export const surveillanceRoutes = Router();

surveillanceRoutes.use(authenticate);

// All authenticated users can list and view
surveillanceRoutes.get('/', controller.listRequests);
surveillanceRoutes.get('/:id', controller.getRequest);

surveillanceRoutes.post('/', controller.createRequest);

// ADMIN, FRANCHISE_MANAGER, MANAGER, and TECHNICIAN can update status
surveillanceRoutes.patch(
  '/:id',
  requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER, Role.TECHNICIAN),
  controller.updateStatus
);

// All authenticated users can delete (service enforces per-role scope)
surveillanceRoutes.delete('/:id', controller.deleteRequest);
