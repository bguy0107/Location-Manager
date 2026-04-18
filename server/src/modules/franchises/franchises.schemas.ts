import { z } from 'zod';

export const createFranchiseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownerId: z.string().uuid('Owner must be a valid user ID'),
});

export const updateFranchiseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  ownerId: z.string().uuid().optional(),
});

export const franchisesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateFranchiseDto = z.infer<typeof createFranchiseSchema>;
export type UpdateFranchiseDto = z.infer<typeof updateFranchiseSchema>;
export type FranchisesQuery = z.infer<typeof franchisesQuerySchema>;
