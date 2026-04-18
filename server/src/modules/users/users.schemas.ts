import { z } from 'zod';
import { Role } from '../../types';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.nativeEnum(Role).default(Role.USER),
  isActive: z.boolean().default(true),
  locationIds: z.array(z.string().uuid()).optional().default([]),
  franchiseId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  locationIds: z.array(z.string().uuid()).optional(),
  franchiseId: z.string().uuid().optional().nullable(),
});

export const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .string()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined))
    .optional(),
  franchiseId: z.string().uuid().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
