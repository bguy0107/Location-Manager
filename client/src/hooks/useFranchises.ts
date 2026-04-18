import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Franchise, PaginatedResponse, ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export interface FranchisesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

async function fetchFranchises(params: FranchisesParams): Promise<PaginatedResponse<Franchise>> {
  const { data } = await api.get('/franchises', { params });
  return data;
}

async function fetchFranchise(id: string): Promise<Franchise> {
  const { data } = await api.get<ApiResponse<Franchise>>(`/franchises/${id}`);
  return data.data;
}

async function createFranchise(body: unknown): Promise<Franchise> {
  const { data } = await api.post<ApiResponse<Franchise>>('/franchises', body);
  return data.data;
}

async function updateFranchise(id: string, body: unknown): Promise<Franchise> {
  const { data } = await api.put<ApiResponse<Franchise>>(`/franchises/${id}`, body);
  return data.data;
}

async function deleteFranchise(id: string): Promise<void> {
  await api.delete(`/franchises/${id}`);
}

export function useFranchises(params: FranchisesParams = {}) {
  return useQuery({
    queryKey: ['franchises', params],
    queryFn: () => fetchFranchises(params),
  });
}

export function useFranchise(id: string) {
  return useQuery({
    queryKey: ['franchises', id],
    queryFn: () => fetchFranchise(id),
    enabled: !!id,
  });
}

export function useCreateFranchise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFranchise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      toast.success('Franchise created successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to create franchise');
    },
  });
}

export function useUpdateFranchise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => updateFranchise(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      toast.success('Franchise updated successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to update franchise');
    },
  });
}

export function useDeleteFranchise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFranchise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      toast.success('Franchise deleted successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to delete franchise');
    },
  });
}
