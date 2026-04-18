import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SurveillanceRequest, PaginatedResponse, ApiResponse, CreateSurveillancePayload } from '@/types';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export interface SurveillanceParams {
  page?: number;
  limit?: number;
  locationId?: string;
  franchiseId?: string;
  status?: string;
}

async function fetchRequests(params: SurveillanceParams): Promise<PaginatedResponse<SurveillanceRequest>> {
  const { data } = await api.get('/surveillance', { params });
  return data;
}

async function fetchRequest(id: string): Promise<SurveillanceRequest> {
  const { data } = await api.get<ApiResponse<SurveillanceRequest>>(`/surveillance/${id}`);
  return data.data;
}

async function createRequest(body: CreateSurveillancePayload): Promise<SurveillanceRequest> {
  const { data } = await api.post<ApiResponse<SurveillanceRequest>>('/surveillance', body);
  return data.data;
}

async function updateStatus(id: string, status: string): Promise<SurveillanceRequest> {
  const { data } = await api.patch<ApiResponse<SurveillanceRequest>>(`/surveillance/${id}`, { status });
  return data.data;
}

async function deleteRequest(id: string): Promise<void> {
  await api.delete(`/surveillance/${id}`);
}

export function useSurveillanceRequests(params: SurveillanceParams = {}) {
  return useQuery({
    queryKey: ['surveillance', params],
    queryFn: () => fetchRequests(params),
  });
}

export function useSurveillanceRequest(id: string) {
  return useQuery({
    queryKey: ['surveillance', id],
    queryFn: () => fetchRequest(id),
    enabled: !!id,
  });
}

export function useCreateSurveillanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance'] });
      toast.success('Surveillance request submitted');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to submit request');
    },
  });
}

export function useUpdateSurveillanceStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance'] });
      toast.success('Status updated');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to update status');
    },
  });
}

export function useDeleteSurveillanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance'] });
      toast.success('Request deleted');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? 'Failed to delete request');
    },
  });
}
