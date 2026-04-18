'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLocations } from '@/hooks/useLocations';
import type { CreateSurveillancePayload } from '@/types';

const schema = z
  .object({
    locationId: z.string().min(1, 'Location is required'),
    requestingParty: z.enum(['LAW_ENFORCEMENT', 'INTERNAL', 'INSURANCE'], {
      required_error: 'Requesting party is required',
    }),
    footageStartAt: z.string().min(1, 'Start date/time is required'),
    footageEndAt: z.string().min(1, 'End date/time is required'),
    cameras: z
      .array(z.object({ value: z.coerce.number({ invalid_type_error: 'Must be a number' }).int().positive('Must be a positive integer') }))
      .min(1, 'At least one camera is required'),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (d) => !d.footageStartAt || !d.footageEndAt || new Date(d.footageEndAt) > new Date(d.footageStartAt),
    { message: 'End time must be after start time', path: ['footageEndAt'] }
  );

type FormData = z.infer<typeof schema>;

interface SurveillanceFormProps {
  onSubmit: (data: CreateSurveillancePayload) => void | Promise<void>;
  isLoading?: boolean;
}

export function SurveillanceForm({ onSubmit, isLoading }: SurveillanceFormProps) {
  const { data: locationsData } = useLocations({ limit: 100 });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationId: '',
      requestingParty: undefined,
      footageStartAt: '',
      footageEndAt: '',
      cameras: [{ value: 1 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'cameras' });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      locationId: data.locationId,
      requestingParty: data.requestingParty,
      footageStartAt: new Date(data.footageStartAt).toISOString(),
      footageEndAt: new Date(data.footageEndAt).toISOString(),
      cameras: data.cameras.map((c) => Number(c.value)),
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Location */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Location <span className="text-red-500">*</span>
        </label>
        <select
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          {...register('locationId')}
        >
          <option value="">Select a location...</option>
          {locationsData?.data.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} (#{loc.storeNumber})
            </option>
          ))}
        </select>
        {errors.locationId && (
          <p className="text-xs text-red-600">{errors.locationId.message}</p>
        )}
      </div>

      {/* Requesting Party */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Requesting Party <span className="text-red-500">*</span>
        </label>
        <select
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          {...register('requestingParty')}
        >
          <option value="">Select...</option>
          <option value="LAW_ENFORCEMENT">Law Enforcement</option>
          <option value="INTERNAL">Internal</option>
          <option value="INSURANCE">Insurance</option>
        </select>
        {errors.requestingParty && (
          <p className="text-xs text-red-600">{errors.requestingParty.message}</p>
        )}
      </div>

      {/* Footage Date/Time Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Footage Start"
          type="datetime-local"
          required
          error={errors.footageStartAt?.message}
          {...register('footageStartAt')}
        />
        <Input
          label="Footage End"
          type="datetime-local"
          required
          error={errors.footageEndAt?.message}
          {...register('footageEndAt')}
        />
      </div>

      {/* Camera Numbers */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Camera Numbers <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ value: 0 })}
            className="text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Camera
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Controller
                control={control}
                name={`cameras.${index}.value`}
                render={({ field: f }) => (
                  <input
                    {...f}
                    type="number"
                    min={1}
                    placeholder={`Camera #${index + 1}`}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove camera"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {errors.cameras?.[index]?.value && (
                <p className="text-xs text-red-600">{errors.cameras[index]?.value?.message}</p>
              )}
            </div>
          ))}
        </div>
        {errors.cameras?.root && (
          <p className="text-xs text-red-600">{errors.cameras.root.message}</p>
        )}
        {errors.cameras?.message && (
          <p className="text-xs text-red-600">{errors.cameras.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
          placeholder="Describe the incident or reason for the request..."
          {...register('notes')}
        />
        {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Submit Request
        </Button>
      </div>
    </form>
  );
}
