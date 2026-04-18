'use client';

import { useState } from 'react';
import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { User, Role } from '@/types';
import { useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
}

const roleVariant: Record<Role, 'info' | 'warning' | 'default'> = {
  ADMIN: 'info',
  MANAGER: 'warning',
  USER: 'default',
  TECHNICIAN: 'default',
};

export function UserTable({ users, isLoading, onEdit }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const deleteUser = useDeleteUser();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canDelete = currentUser?.role === Role.ADMIN;
  const canEdit =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGER;

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteUser.mutateAsync(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) =>
        user.isActive ? (
          <Badge variant="success" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="danger" className="gap-1">
            <UserX className="h-3 w-3" />
            Inactive
          </Badge>
        ),
    },
    {
      key: 'locations',
      header: 'Locations',
      render: (user: User) => (
        <span className="text-gray-500 text-sm">{user.locations.length}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user: User) => (
        <span className="text-gray-500 text-sm">{formatDate(user.createdAt)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: (user: User) => (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(user)}
              className="text-gray-500 hover:text-primary-600"
              aria-label={`Edit ${user.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant={confirmDeleteId === user.id ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => handleDelete(user.id)}
              isLoading={deleteUser.isPending && confirmDeleteId === user.id}
              aria-label={confirmDeleteId === user.id ? 'Confirm delete' : `Delete ${user.name}`}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDeleteId === user.id && (
                <span className="ml-1 text-xs">Confirm</span>
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={users}
      isLoading={isLoading}
      keyExtractor={(u) => u.id}
      emptyMessage="No users found. Try adjusting your search."
    />
  );
}
