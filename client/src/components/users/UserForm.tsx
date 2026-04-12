'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Role } from '@/types';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/providers/AuthProvider';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
  locationIds: z.array(z.string()),
});

const editSchema = createSchema
  .extend({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .or(z.literal('')),
  })
  .transform((data) => ({
    ...data,
    password: data.password === '' ? undefined : data.password,
  }));

type CreateFormData = z.infer<typeof createSchema>;

interface UserFormProps {
  user?: User;
  onSubmit: (data: Partial<CreateFormData>) => void | Promise<void>;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, isLoading }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const { data: locationsData } = useLocations({ limit: 100 });
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateFormData>({
    resolver: zodResolver(isEditing ? (editSchema as any) : createSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? Role.USER,
      isActive: user?.isActive ?? true,
      locationIds: user?.locations.map((ul) => ul.location.id) ?? [],
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive,
        locationIds: user.locations.map((ul) => ul.location.id),
      });
    }
  }, [user, reset]);

  const watchedLocationIds = watch('locationIds');

  const toggleLocation = (locationId: string, current: string[], onChange: (v: string[]) => void) => {
    if (current.includes(locationId)) {
      onChange(current.filter((id) => id !== locationId));
    } else {
      onChange([...current, locationId]);
    }
  };

  // MANAGER cannot assign ADMIN role
  const isManagerActor = currentUser?.role === Role.MANAGER;
  const availableRoles = isManagerActor
    ? [Role.MANAGER, Role.USER]
    : [Role.ADMIN, Role.MANAGER, Role.USER];

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Input
        label="Full name"
        placeholder="John Doe"
        error={errors.name?.message}
        required
        {...register('name')}
      />

      <Input
        label="Email address"
        type="email"
        placeholder="john@example.com"
        error={errors.email?.message}
        required
        {...register('email')}
      />

      <Input
        label={isEditing ? 'New password (leave blank to keep current)' : 'Password'}
        type="password"
        placeholder={isEditing ? '••••••••' : 'Min 8 chars, 1 uppercase, 1 number'}
        error={errors.password?.message}
        required={!isEditing}
        {...register('password')}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('role')}
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('isActive', { setValueAs: (v) => v === 'true' || v === true })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Location assignment */}
      {locationsData && locationsData.data.length > 0 && (
        <Controller
          name="locationIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Assigned Locations</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {locationsData.data.map((loc) => (
                  <label
                    key={loc.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(loc.id)}
                      onChange={() =>
                        toggleLocation(loc.id, field.value, field.onChange)
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium">{loc.name}</span>
                    <span className="text-gray-400">#{loc.storeNumber}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {field.value.length} location(s) selected
              </p>
            </div>
          )}
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {isEditing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}
