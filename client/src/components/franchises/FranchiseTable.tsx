'use client';

import { useState } from 'react';
import { Trash2, Building2 } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Franchise, FranchiseStatus } from '@/types';
import { useDeleteFranchise } from '@/hooks/useFranchises';
import { formatDate } from '@/lib/utils';

interface FranchiseTableProps {
  franchises: Franchise[];
  isLoading?: boolean;
  onEdit: (franchise: Franchise) => void;
}

export function FranchiseTable({ franchises, isLoading, onEdit }: FranchiseTableProps) {
  const deleteFranchise = useDeleteFranchise();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteFranchise.mutateAsync(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Franchise',
      render: (f: Franchise) => (
        <div className="flex items-center gap-3">
          {f.logoUrl ? (
            <img
              src={f.logoUrl}
              alt={f.name}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{f.name}</p>
            <p className="text-xs text-gray-500">Owner: {f.owner.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: Franchise) => (
        <Badge variant={f.status === FranchiseStatus.ACTIVE ? 'success' : 'default'}>
          {f.status}
        </Badge>
      ),
    },
    {
      key: 'locations',
      header: 'Locations',
      render: (f: Franchise) => (
        <span className="text-gray-500 text-sm">{f._count.locations}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'managers',
      header: 'Managers',
      render: (f: Franchise) => (
        <span className="text-gray-500 text-sm">{f._count.managers}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (f: Franchise) => (
        <span className="text-gray-500 text-sm">{formatDate(f.createdAt)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: (f: Franchise) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant={confirmDeleteId === f.id ? 'danger' : 'ghost'}
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
            isLoading={deleteFranchise.isPending && confirmDeleteId === f.id}
            aria-label={confirmDeleteId === f.id ? 'Confirm delete' : `Delete ${f.name}`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDeleteId === f.id && <span className="ml-1 text-xs">Confirm</span>}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={franchises}
      isLoading={isLoading}
      keyExtractor={(f) => f.id}
      emptyMessage="No franchises found."
      onRowClick={onEdit}
    />
  );
}
