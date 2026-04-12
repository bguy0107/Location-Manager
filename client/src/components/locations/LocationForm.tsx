'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Location } from '@/types';
import { useUsers } from '@/hooks/useUsers';

const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  storeNumber: z.string().min(1, 'Store number is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'Zip code must be at least 5 characters'),
  notes: z.string().max(1000).optional(),
  userIds: z.array(z.string()),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: LocationFormData) => void | Promise<void>;
  isLoading?: boolean;
}

export function LocationForm({ location, onSubmit, isLoading }: LocationFormProps) {
  const { data: usersData } = useUsers({ limit: 100, isActive: true });
  const isEditing = !!location;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name ?? '',
      storeNumber: location?.storeNumber ?? '',
      address: location?.address ?? '',
      city: location?.city ?? '',
      state: location?.state ?? '',
      zip: location?.zip ?? '',
      notes: location?.notes ?? '',
      userIds: location?.users.map((ul) => ul.user.id) ?? [],
    },
  });

  useEffect(() => {
    if (location) {
      reset({
        name: location.name,
        storeNumber: location.storeNumber,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        notes: location.notes ?? '',
        userIds: location.users.map((ul) => ul.user.id),
      });
    }
  }, [location, reset]);

  const toggleUser = (userId: string, current: string[], onChange: (v: string[]) => void) => {
    if (current.includes(userId)) {
      onChange(current.filter((id) => id !== userId));
    } else {
      onChange([...current, userId]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Location name"
          placeholder="Downtown Store"
          error={errors.name?.message}
          required
          {...register('name')}
        />
        <Input
          label="Store number"
          placeholder="STR-001"
          error={errors.storeNumber?.message}
          required
          {...register('storeNumber')}
        />
      </div>

      <Input
        label="Street address"
        placeholder="123 Main Street"
        error={errors.address?.message}
        required
        {...register('address')}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          placeholder="New York"
          error={errors.city?.message}
          required
          className="col-span-2 sm:col-span-1"
          {...register('city')}
        />
        <Input
          label="State"
          placeholder="NY"
          error={errors.state?.message}
          required
          {...register('state')}
        />
        <Input
          label="Zip code"
          placeholder="10001"
          error={errors.zip?.message}
          required
          {...register('zip')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
          placeholder="Any additional notes about this location..."
          {...register('notes')}
        />
        {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      {/* User assignment */}
      {usersData && usersData.data.length > 0 && (
        <Controller
          name="userIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Assigned Users</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {usersData.data.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(u.id)}
                      onChange={() =>
                        toggleUser(u.id, field.value, field.onChange)
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium">{u.name}</span>
                    <span className="text-gray-400 text-xs">{u.role}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {field.value.length} user(s) assigned
              </p>
            </div>
          )}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {isEditing ? 'Save changes' : 'Create location'}
        </Button>
      </div>
    </form>
  );
}
