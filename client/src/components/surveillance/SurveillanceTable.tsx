'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SurveillanceRequest, RequestStatus, RequestingParty, Role } from '@/types';
import { useDeleteSurveillanceRequest } from '@/hooks/useSurveillance';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';
import type { BadgeVariant } from '@/components/ui/Badge';

const statusVariant: Record<RequestStatus, BadgeVariant> = {
  [RequestStatus.PENDING]: 'warning',
  [RequestStatus.IN_PROGRESS]: 'info',
  [RequestStatus.FULFILLED]: 'success',
  [RequestStatus.DENIED]: 'danger',
};

const statusLabel: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'Pending',
  [RequestStatus.IN_PROGRESS]: 'In Progress',
  [RequestStatus.FULFILLED]: 'Fulfilled',
  [RequestStatus.DENIED]: 'Denied',
};

const partyLabel: Record<RequestingParty, string> = {
  [RequestingParty.LAW_ENFORCEMENT]: 'Law Enforcement',
  [RequestingParty.INTERNAL]: 'Internal',
  [RequestingParty.INSURANCE]: 'Insurance',
};

interface SurveillanceTableProps {
  requests: SurveillanceRequest[];
  isLoading?: boolean;
  onView: (request: SurveillanceRequest) => void;
}

export function SurveillanceTable({ requests, isLoading, onView }: SurveillanceTableProps) {
  const { user: currentUser } = useAuth();
  const deleteRequest = useDeleteSurveillanceRequest();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canDeleteRequest = (r: SurveillanceRequest) => {
    if (!currentUser) return false;
    if (currentUser.role === Role.USER) return r.requestedBy.id === currentUser.id;
    // ADMIN, FRANCHISE_MANAGER, MANAGER, TECHNICIAN can delete (backend scopes by assignment/franchise)
    return true;
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteRequest.mutateAsync(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const columns = [
    {
      key: 'location',
      header: 'Location',
      render: (r: SurveillanceRequest) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{r.location.name}</p>
          <p className="text-xs text-gray-500">#{r.location.storeNumber}</p>
        </div>
      ),
    },
    {
      key: 'cameras',
      header: 'Cameras',
      render: (r: SurveillanceRequest) => (
        <span className="text-sm text-gray-700">
          {r.cameras.map((c) => `#${c}`).join(', ')}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'footage',
      header: 'Footage Period',
      render: (r: SurveillanceRequest) => (
        <div className="text-sm text-gray-700 whitespace-nowrap">
          <p>{formatDate(r.footageStartAt)}</p>
          <p className="text-xs text-gray-500">to {formatDate(r.footageEndAt)}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'requestingParty',
      header: 'Requesting Party',
      render: (r: SurveillanceRequest) => (
        <span className="text-sm text-gray-700">{partyLabel[r.requestingParty]}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: SurveillanceRequest) => (
        <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (r: SurveillanceRequest) => (
        <div className="text-sm text-gray-500 whitespace-nowrap">
          <p>{formatDate(r.createdAt)}</p>
          <p className="text-xs">{r.requestedBy.name}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: (r: SurveillanceRequest) => (
        <div className="flex items-center gap-2 justify-end">
          {canDeleteRequest(r) && (
            <Button
              variant={confirmDeleteId === r.id ? 'danger' : 'ghost'}
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
              isLoading={deleteRequest.isPending && confirmDeleteId === r.id}
              aria-label={confirmDeleteId === r.id ? 'Confirm delete' : 'Delete request'}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDeleteId === r.id && <span className="ml-1 text-xs">Confirm</span>}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={requests}
      isLoading={isLoading}
      keyExtractor={(r) => r.id}
      emptyMessage="No surveillance requests found."
      onRowClick={onView}
    />
  );
}
