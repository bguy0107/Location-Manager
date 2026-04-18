'use client';

import { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { useFranchises } from '@/hooks/useFranchises';
import { FranchiseTable } from '@/components/franchises/FranchiseTable';
import { FranchiseModal } from '@/components/franchises/FranchiseModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Franchise, FranchiseStatus } from '@/types';

export default function FranchisesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | undefined>();

  const { data, isLoading } = useFranchises({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFranchise(undefined);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            Franchises
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {data.total} franchise{data.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Franchise
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search franchises..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All statuses</option>
          <option value={FranchiseStatus.ACTIVE}>Active</option>
          <option value={FranchiseStatus.INACTIVE}>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <FranchiseTable
        franchises={data?.data ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Modal */}
      <FranchiseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        franchise={editingFranchise}
      />
    </div>
  );
}
