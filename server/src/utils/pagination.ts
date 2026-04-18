import { PaginationParams } from '../types';

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}
