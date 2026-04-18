import { z } from 'zod';

export const createSurveillanceRequestSchema = z
  .object({
    locationId: z.string().uuid('Invalid location ID'),
    requestingParty: z.enum(['LAW_ENFORCEMENT', 'INTERNAL', 'INSURANCE']),
    footageStartAt: z.coerce.date(),
    footageEndAt: z.coerce.date(),
    cameras: z
      .array(z.number().int().positive('Camera number must be a positive integer'))
      .min(1, 'At least one camera number is required')
      .max(50, 'Cannot exceed 50 camera numbers per request'),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.footageEndAt > data.footageStartAt, {
    message: 'Footage end time must be after start time',
    path: ['footageEndAt'],
  });

export const updateSurveillanceRequestSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'FULFILLED', 'DENIED']),
});

export const surveillanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  locationId: z.string().uuid().optional(),
  franchiseId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'FULFILLED', 'DENIED']).optional(),
});

export type CreateSurveillanceRequestDto = z.infer<typeof createSurveillanceRequestSchema>;
export type UpdateSurveillanceRequestDto = z.infer<typeof updateSurveillanceRequestSchema>;
export type SurveillanceQuery = z.infer<typeof surveillanceQuerySchema>;
