import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Location, PaginatedResponse, ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export interface LocationsParams {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  city?: string;
}

async function fetchLocations(params: LocationsParams): Promise<PaginatedResponse<Location>> {
  const { data } = await api.get('/locations', { params });
  return data;
}

async function fetchLocation(id: string): Promise<Location> {
  const { data } = await api.get<ApiResponse<Location>>(`/locations/${id}`);
  return data.data;
}

async function createLocation(body: unknown): Promise<Location> {
  const { data } = await api.post<ApiResponse<Location>>('/locations', body);
  return data.data;
}

async function updateLocation(id: string, body: unknown): Promise<Location> {
  const { data } = await api.put<ApiResponse<Location>>(`/locations/${id}`, body);
  return data.data;
}

async function deleteLocation(id: string): Promise<void> {
  await api.delete(`/locations/${id}`);
}

export function useLocations(params: LocationsParams = {}) {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => fetchLocations(params),
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => fetchLocation(id),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Location created successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to create location');
    },
  });
}

export function useUpdateLocation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => updateLocation(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location updated successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to update location');
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Location deleted successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to delete location');
    },
  });
}
