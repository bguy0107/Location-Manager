import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  storeNumber: z.string().min(1, 'Store number is required').max(50),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().min(2, 'State must be at least 2 characters').max(50),
  zip: z.string().min(5, 'Zip code must be at least 5 characters').max(10),
  notes: z.string().max(1000).optional(),
  userIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateLocationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  storeNumber: z.string().min(1).max(50).optional(),
  address: z.string().min(5).max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  zip: z.string().min(5).max(10).optional(),
  notes: z.string().max(1000).nullable().optional(),
  userIds: z.array(z.string().uuid()).optional(),
});

export const locationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
export type LocationsQuery = z.infer<typeof locationsQuerySchema>;
