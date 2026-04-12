import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { ForbiddenError } from '../utils/errors';

/**
 * Middleware factory that restricts access to users with specific roles.
 * Must be used after the authenticate middleware.
 *
 * Usage: router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), controller)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
