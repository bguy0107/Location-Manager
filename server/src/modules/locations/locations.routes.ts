import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './locations.controller';

export const locationsRoutes = Router();

// All routes require authentication
locationsRoutes.use(authenticate);

// All authenticated users can read locations (service filters by role)
locationsRoutes.get('/', controller.listLocations);
locationsRoutes.get('/:id', controller.getLocation);

// Only ADMIN can create or update location info
locationsRoutes.post('/', requireRole(Role.ADMIN), controller.createLocation);
locationsRoutes.put('/:id', requireRole(Role.ADMIN), controller.updateLocation);

// ADMIN and MANAGER can update user assignments (manager scoped to their locations)
locationsRoutes.patch('/:id/assignments', requireRole(Role.ADMIN, Role.MANAGER), controller.updateAssignments);

// Only ADMIN can delete
locationsRoutes.delete('/:id', requireRole(Role.ADMIN), controller.deleteLocation);
