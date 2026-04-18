import * as franchisesRepo from './franchises.repository';
import { CreateFranchiseDto, UpdateFranchiseDto, FranchisesQuery } from './franchises.schemas';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedUser, Role } from '../../types';
import { buildPaginatedResponse } from '../../utils/pagination';

export async function getFranchises(query: FranchisesQuery, actor: AuthenticatedUser) {
  const skip = (query.page - 1) * query.limit;

  const { data, total } = await franchisesRepo.findMany({
    skip,
    take: query.limit,
    search: query.search,
    status: query.status,
  });

  return buildPaginatedResponse(data, total, { page: query.page, limit: query.limit, skip });
}

export async function getFranchiseById(id: string, actor: AuthenticatedUser) {
  const franchise = await franchisesRepo.findById(id);
  if (!franchise) throw new NotFoundError('Franchise');

  if (actor.role === Role.FRANCHISE_MANAGER && actor.franchiseId !== id) {
    throw new NotFoundError('Franchise');
  }

  return franchise;
}

export async function createFranchise(dto: CreateFranchiseDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN) throw new ForbiddenError();

  return franchisesRepo.create({
    name: dto.name,
    status: dto.status,
    logoUrl: dto.logoUrl || null,
    ownerId: dto.ownerId,
  });
}

export async function updateFranchise(id: string, dto: UpdateFranchiseDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN) throw new ForbiddenError();

  const existing = await franchisesRepo.findById(id);
  if (!existing) throw new NotFoundError('Franchise');

  return franchisesRepo.update(id, {
    name: dto.name,
    status: dto.status,
    logoUrl: dto.logoUrl,
    ownerId: dto.ownerId,
  });
}

export async function deleteFranchise(id: string, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN) throw new ForbiddenError();

  const existing = await franchisesRepo.findById(id);
  if (!existing) throw new NotFoundError('Franchise');

  return franchisesRepo.remove(id);
}

export async function getDashboardStats() {
  return { total: await franchisesRepo.countAll() };
}
