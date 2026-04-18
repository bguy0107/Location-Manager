'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Franchise, FranchiseStatus } from '@/types';
import { useUsers } from '@/hooks/useUsers';

const franchiseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  status: z.nativeEnum(FranchiseStatus),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  ownerId: z.string().min(1, 'Owner is required'),
});

type FranchiseFormValues = z.infer<typeof franchiseSchema>;

interface FranchiseFormProps {
  franchise?: Franchise;
  onSubmit: (data: FranchiseFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

export function FranchiseForm({ franchise, onSubmit, isLoading }: FranchiseFormProps) {
  const { data: usersData } = useUsers({ limit: 100, isActive: true });
  const isEditing = !!franchise;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FranchiseFormValues>({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      name: franchise?.name ?? '',
      status: franchise?.status ?? FranchiseStatus.ACTIVE,
      logoUrl: franchise?.logoUrl ?? '',
      ownerId: franchise?.owner.id ?? '',
    },
  });

  useEffect(() => {
    if (franchise) {
      reset({
        name: franchise.name,
        status: franchise.status,
        logoUrl: franchise.logoUrl ?? '',
        ownerId: franchise.owner.id,
      });
    }
  }, [franchise, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Franchise name"
        placeholder="Acme Franchise"
        error={errors.name?.message}
        required
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('status')}
          >
            <option value={FranchiseStatus.ACTIVE}>Active</option>
            <option value={FranchiseStatus.INACTIVE}>Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Franchise Owner <span className="text-red-500">*</span>
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('ownerId')}
          >
            <option value="">Select owner...</option>
            {usersData?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {errors.ownerId && (
            <p className="text-xs text-red-600">{errors.ownerId.message}</p>
          )}
        </div>
      </div>

      <Input
        label="Logo URL (optional)"
        placeholder="https://example.com/logo.png"
        error={errors.logoUrl?.message}
        {...register('logoUrl')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {isEditing ? 'Save changes' : 'Create franchise'}
        </Button>
      </div>
    </form>
  );
}
