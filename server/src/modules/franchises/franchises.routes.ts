import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import * as controller from './franchises.controller';

export const franchisesRoutes = Router();

franchisesRoutes.use(authenticate);

// ADMIN and FRANCHISE_MANAGER can list/read franchises
franchisesRoutes.get('/', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.listFranchises);
franchisesRoutes.get('/:id', requireRole(Role.ADMIN, Role.FRANCHISE_MANAGER), controller.getFranchise);

// Only ADMIN can create, update, delete franchises
franchisesRoutes.post('/', requireRole(Role.ADMIN), controller.createFranchise);
franchisesRoutes.put('/:id', requireRole(Role.ADMIN), controller.updateFranchise);
franchisesRoutes.delete('/:id', requireRole(Role.ADMIN), controller.deleteFranchise);
