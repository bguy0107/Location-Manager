'use client';

import { Modal } from '@/components/ui/Modal';
import { LocationForm } from './LocationForm';
import { Location, Role } from '@/types';
import { useCreateLocation, useUpdateLocation, useUpdateLocationAssignments } from '@/hooks/useLocations';
import { useAuth } from '@/providers/AuthProvider';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location;
}

export function LocationModal({ isOpen, onClose, location }: LocationModalProps) {
  const { user: currentUser } = useAuth();
  const isEditing = !!location;
  const assignmentsOnly =
    isEditing &&
    currentUser?.role !== Role.ADMIN &&
    currentUser?.role !== Role.FRANCHISE_MANAGER &&
    currentUser?.role === Role.MANAGER;

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation(location?.id ?? '');
  const updateAssignments = useUpdateLocationAssignments(location?.id ?? '');

  const isPending = isEditing
    ? (assignmentsOnly ? updateAssignments.isPending : updateLocation.isPending)
    : createLocation.isPending;

  const handleSubmit = async (data: { userIds: string[]; [key: string]: unknown }) => {
    try {
      if (isEditing) {
        if (assignmentsOnly) {
          await updateAssignments.mutateAsync({ userIds: data.userIds });
        } else {
          await updateLocation.mutateAsync(data);
        }
      } else {
        await createLocation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation's onError toast
    }
  };

  const title = assignmentsOnly ? 'Manage Users' : isEditing ? 'Edit Location' : 'Create Location';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <LocationForm
        location={location}
        onSubmit={handleSubmit}
        isLoading={isPending}
        assignmentsOnly={assignmentsOnly}
      />
    </Modal>
  );
}
