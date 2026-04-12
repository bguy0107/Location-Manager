'use client';

import { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { LocationTable } from '@/components/locations/LocationTable';
import { LocationModal } from '@/components/locations/LocationModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { Location, Role } from '@/types';

export default function LocationsPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();

  const { data, isLoading } = useLocations({
    page,
    limit: 20,
    search: search || undefined,
    state: stateFilter || undefined,
  });

  const canCreate =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGER;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(undefined);
  };

  // Unique states from current results for filter dropdown
  const states = Array.from(new Set(data?.data.map((l) => l.state) ?? [])).sort();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary-600" />
            Locations
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {data.total} location{data.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, number, city..."
          className="flex-1"
        />
        <select
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <LocationTable
        locations={data?.data ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        location={editingLocation}
      />
    </div>
  );
}
