'use client';

import { useState } from 'react';
import { Plus, Camera } from 'lucide-react';
import { useSurveillanceRequests } from '@/hooks/useSurveillance';
import { SurveillanceTable } from '@/components/surveillance/SurveillanceTable';
import { SurveillanceModal } from '@/components/surveillance/SurveillanceModal';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { SurveillanceRequest, RequestStatus } from '@/types';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: RequestStatus.PENDING },
  { label: 'In Progress', value: RequestStatus.IN_PROGRESS },
  { label: 'Fulfilled', value: RequestStatus.FULFILLED },
  { label: 'Denied', value: RequestStatus.DENIED },
];

export default function SurveillancePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<SurveillanceRequest | undefined>();

  const { data, isLoading } = useSurveillanceRequests({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleView = (request: SurveillanceRequest) => {
    setViewingRequest(request);
  };

  const handleCloseViewModal = () => {
    setViewingRequest(undefined);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary-600" />
            Surveillance Requests
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {data.total} request{data.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <SurveillanceTable
        requests={data?.data ?? []}
        isLoading={isLoading}
        onView={handleView}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Create modal */}
      <SurveillanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* View/update modal */}
      <SurveillanceModal
        isOpen={!!viewingRequest}
        onClose={handleCloseViewModal}
        request={viewingRequest}
      />
    </div>
  );
}
