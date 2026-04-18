'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SurveillanceForm } from './SurveillanceForm';
import { SurveillanceRequest, RequestStatus, RequestingParty, Role, CreateSurveillancePayload } from '@/types';
import {
  useCreateSurveillanceRequest,
  useUpdateSurveillanceStatus,
  useSurveillanceRequest,
} from '@/hooks/useSurveillance';
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

const nextStatuses: Partial<Record<RequestStatus, RequestStatus[]>> = {
  [RequestStatus.PENDING]: [RequestStatus.IN_PROGRESS, RequestStatus.FULFILLED, RequestStatus.DENIED],
  [RequestStatus.IN_PROGRESS]: [RequestStatus.FULFILLED, RequestStatus.DENIED],
};

interface SurveillanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: SurveillanceRequest;
}

export function SurveillanceModal({ isOpen, onClose, request }: SurveillanceModalProps) {
  const { user: currentUser } = useAuth();
  const createRequest = useCreateSurveillanceRequest();
  const updateStatus = useUpdateSurveillanceStatus(request?.id ?? '');
  const { data: detail } = useSurveillanceRequest(request?.id ?? '');

  const isViewing = !!request;
  const canUpdateStatus =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGER;

  const displayed = detail ?? request;

  const available = displayed ? (nextStatuses[displayed.status] ?? []) : [];
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(available[0] ?? RequestStatus.FULFILLED);

  // Reset dropdown default when a different request is opened
  useEffect(() => {
    const opts = displayed ? (nextStatuses[displayed.status] ?? []) : [];
    if (opts.length > 0) setSelectedStatus(opts[0]);
  }, [request?.id, displayed?.status]);

  const handleCreate = async (data: CreateSurveillancePayload) => {
    try {
      await createRequest.mutateAsync(data);
      onClose();
    } catch {
      // handled by mutation onError
    }
  };

  const handleStatusChange = async () => {
    try {
      await updateStatus.mutateAsync(selectedStatus);
      onClose();
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewing ? 'Surveillance Request' : 'New Surveillance Request'}
      size="xl"
    >
      {isViewing && displayed ? (
        <div className="space-y-4">
          {/* Status badge only — submission info moved to history */}
          <div>
            <Badge variant={statusVariant[displayed.status]}>{statusLabel[displayed.status]}</Badge>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Detail label="Location">
              {displayed.location.name} (#{displayed.location.storeNumber})
            </Detail>
            <Detail label="Requesting Party">{partyLabel[displayed.requestingParty]}</Detail>
            <Detail label="Footage Start">{formatDate(displayed.footageStartAt)}</Detail>
            <Detail label="Footage End">{formatDate(displayed.footageEndAt)}</Detail>
            <Detail label="Cameras">
              {displayed.cameras.map((c) => `#${c}`).join(', ')}
            </Detail>
          </div>

          {displayed.notes && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayed.notes}</p>
            </div>
          )}

          {/* Status history — always shown, submission entry always first */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Status History
            </p>
            <ol className="space-y-2">
              <li className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap min-w-[120px]">
                  {formatDate(displayed.createdAt)}
                </span>
                <span className="text-gray-600 flex items-center flex-wrap gap-1">
                  <span className="text-gray-500">Submitted</span>
                  <Badge variant="warning">Pending</Badge>
                  <span className="text-gray-500">by</span>
                  <span className="font-medium text-gray-700">{displayed.requestedBy.name}</span>
                </span>
              </li>
              {displayed.statusHistory?.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap min-w-[120px]">
                    {formatDate(entry.changedAt)}
                  </span>
                  <span className="text-gray-600 flex items-center flex-wrap gap-1">
                    <Badge variant={statusVariant[entry.fromStatus]}>
                      {statusLabel[entry.fromStatus]}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <Badge variant={statusVariant[entry.toStatus]}>
                      {statusLabel[entry.toStatus]}
                    </Badge>
                    <span className="text-gray-500">by</span>
                    <span className="font-medium text-gray-700">{entry.changedBy.name}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Status update dropdown for managers/admins */}
          {canUpdateStatus && available.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Update Status
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {available.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleStatusChange}
                  isLoading={updateStatus.isPending}
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : !isViewing ? (
        <SurveillanceForm onSubmit={handleCreate} isLoading={createRequest.isPending} />
      ) : null}
    </Modal>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{children}</p>
    </div>
  );
}
