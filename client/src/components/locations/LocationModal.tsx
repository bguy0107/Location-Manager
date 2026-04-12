'use client';

import { Modal } from '@/components/ui/Modal';
import { LocationForm } from './LocationForm';
import { Location } from '@/types';
import { useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location;
}

export function LocationModal({ isOpen, onClose, location }: LocationModalProps) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation(location?.id ?? '');

  const isEditing = !!location;
  const isPending = isEditing ? updateLocation.isPending : createLocation.isPending;

  const handleSubmit = async (data: unknown) => {
    try {
      if (isEditing) {
        await updateLocation.mutateAsync(data);
      } else {
        await createLocation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation's onError toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Location' : 'Create Location'}
      size="xl"
    >
      <LocationForm location={location} onSubmit={handleSubmit} isLoading={isPending} />
    </Modal>
  );
}
