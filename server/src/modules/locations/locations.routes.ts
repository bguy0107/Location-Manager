import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './locations.controller';

export const locationsRoutes = Router();

locationsRoutes.use(authenticate);

// All authenticated users can read locations (service filters by role)
locationsRoutes.get('/', controller.listLocations);
locationsRoutes.get('/:id', controller.getLocation);

// ADMIN and FRANCHISE_MANAGER can create or update location info
locationsRoutes.post('/', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.createLocation);
locationsRoutes.put('/:id', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.updateLocation);

// ADMIN, FRANCHISE_MANAGER, and MANAGER can update user assignments
locationsRoutes.patch(
  '/:id/assignments',
  requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER, Role.MANAGER),
  controller.updateAssignments,
);

// ADMIN and FRANCHISE_MANAGER can delete
locationsRoutes.delete('/:id', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.deleteLocation);
