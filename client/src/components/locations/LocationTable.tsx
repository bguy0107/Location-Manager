'use client';

import { useState } from 'react';
import { Pencil, Trash2, MapPin } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Location, Role } from '@/types';
import { useDeleteLocation } from '@/hooks/useLocations';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';

interface LocationTableProps {
  locations: Location[];
  isLoading?: boolean;
  onEdit: (location: Location) => void;
}

export function LocationTable({ locations, isLoading, onEdit }: LocationTableProps) {
  const { user: currentUser } = useAuth();
  const deleteLocation = useDeleteLocation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canEdit =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGER;
  const canDelete = currentUser?.role === Role.ADMIN;

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteLocation.mutateAsync(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Location',
      render: (loc: Location) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{loc.name}</p>
            <p className="text-xs text-gray-500">#{loc.storeNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (loc: Location) => (
        <div className="min-w-0">
          <p className="text-sm text-gray-700 truncate">{loc.address}</p>
          <p className="text-xs text-gray-500">
            {loc.city}, {loc.state} {loc.zip}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'users',
      header: 'Users',
      render: (loc: Location) => (
        <span className="text-gray-500 text-sm">{loc.users.length}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (loc: Location) => (
        <span className="text-gray-500 text-sm">{formatDate(loc.createdAt)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: (loc: Location) => (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(loc)}
              className="text-gray-500 hover:text-primary-600"
              aria-label={`Edit ${loc.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant={confirmDeleteId === loc.id ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => handleDelete(loc.id)}
              isLoading={deleteLocation.isPending && confirmDeleteId === loc.id}
              aria-label={confirmDeleteId === loc.id ? 'Confirm delete' : `Delete ${loc.name}`}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDeleteId === loc.id && (
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
      data={locations}
      isLoading={isLoading}
      keyExtractor={(l) => l.id}
      emptyMessage="No locations found. Try adjusting your search."
    />
  );
}
