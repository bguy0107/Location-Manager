'use client';

import { Modal } from '@/components/ui/Modal';
import { FranchiseForm } from './FranchiseForm';
import { Franchise } from '@/types';
import { useCreateFranchise, useUpdateFranchise } from '@/hooks/useFranchises';

interface FranchiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  franchise?: Franchise;
}

export function FranchiseModal({ isOpen, onClose, franchise }: FranchiseModalProps) {
  const isEditing = !!franchise;
  const createFranchise = useCreateFranchise();
  const updateFranchise = useUpdateFranchise(franchise?.id ?? '');

  const isPending = isEditing ? updateFranchise.isPending : createFranchise.isPending;

  const handleSubmit = async (data: unknown) => {
    try {
      if (isEditing) {
        await updateFranchise.mutateAsync(data);
      } else {
        await createFranchise.mutateAsync(data);
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
      title={isEditing ? 'Edit Franchise' : 'Create Franchise'}
      size="lg"
    >
      <FranchiseForm franchise={franchise} onSubmit={handleSubmit} isLoading={isPending} />
    </Modal>
  );
}
