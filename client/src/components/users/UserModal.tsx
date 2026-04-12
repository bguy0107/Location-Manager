'use client';

import { Modal } from '@/components/ui/Modal';
import { UserForm } from './UserForm';
import { User } from '@/types';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User; // If provided, we're editing
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? '');

  const isEditing = !!user;
  const isPending = isEditing ? updateUser.isPending : createUser.isPending;

  const handleSubmit = async (data: unknown) => {
    try {
      if (isEditing) {
        await updateUser.mutateAsync(data);
      } else {
        await createUser.mutateAsync(data);
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
      title={isEditing ? 'Edit User' : 'Create User'}
      size="lg"
    >
      <UserForm user={user} onSubmit={handleSubmit} isLoading={isPending} />
    </Modal>
  );
}
