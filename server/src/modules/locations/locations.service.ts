import * as locationsRepo from './locations.repository';
import { CreateLocationDto, UpdateLocationDto, UpdateAssignmentsDto, LocationsQuery } from './locations.schemas';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedUser, Role } from '../../types';
import { buildPaginatedResponse } from '../../utils/pagination';

export async function getLocations(query: LocationsQuery, actor: AuthenticatedUser) {
  const skip = (query.page - 1) * query.limit;

  // MANAGER, USER and TECHNICIAN only see their assigned locations
  const userId =
    actor.role === Role.MANAGER || actor.role === Role.USER || actor.role === Role.TECHNICIAN
      ? actor.id
      : undefined;

  // FRANCHISE_MANAGER only sees locations in their franchise
  const franchiseId =
    actor.role === Role.FRANCHISE_MANAGER ? actor.franchiseId : query.franchiseId;

  const { data, total } = await locationsRepo.findMany({
    skip,
    take: query.limit,
    search: query.search,
    state: query.state,
    city: query.city,
    userId,
    franchiseId,
  });

  return buildPaginatedResponse(data, total, { page: query.page, limit: query.limit, skip });
}

export async function getLocationById(id: string, actor: AuthenticatedUser) {
  const location = await locationsRepo.findById(id);
  if (!location) throw new NotFoundError('Location');

  if (actor.role === Role.MANAGER || actor.role === Role.USER || actor.role === Role.TECHNICIAN) {
    const isAssigned = location.users.some((ul) => ul.user.id === actor.id);
    if (!isAssigned) throw new NotFoundError('Location');
  }

  if (actor.role === Role.FRANCHISE_MANAGER && location.franchiseId !== actor.franchiseId) {
    throw new NotFoundError('Location');
  }

  return location;
}

export async function createLocation(dto: CreateLocationDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.FRANCHISE_MANAGER) throw new ForbiddenError();

  // FRANCHISE_MANAGER must assign location to their franchise
  const franchiseId =
    actor.role === Role.FRANCHISE_MANAGER ? actor.franchiseId : dto.franchiseId ?? null;

  return locationsRepo.create({
    name: dto.name,
    storeNumber: dto.storeNumber,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zip: dto.zip,
    notes: dto.notes,
    userIds: dto.userIds,
    franchiseId,
  });
}

export async function updateLocation(id: string, dto: UpdateLocationDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.FRANCHISE_MANAGER) throw new ForbiddenError();

  const existing = await locationsRepo.findById(id);
  if (!existing) throw new NotFoundError('Location');

  if (actor.role === Role.FRANCHISE_MANAGER && existing.franchiseId !== actor.franchiseId) {
    throw new ForbiddenError();
  }

  const franchiseId =
    actor.role === Role.FRANCHISE_MANAGER
      ? actor.franchiseId
      : dto.franchiseId !== undefined
        ? dto.franchiseId
        : existing.franchiseId;

  return locationsRepo.update(id, {
    name: dto.name,
    storeNumber: dto.storeNumber,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zip: dto.zip,
    notes: dto.notes,
    userIds: dto.userIds,
    franchiseId,
  });
}

export async function updateLocationAssignments(
  id: string,
  dto: UpdateAssignmentsDto,
  actor: AuthenticatedUser,
) {
  const existing = await locationsRepo.findById(id);
  if (!existing) throw new NotFoundError('Location');

  if (actor.role === Role.MANAGER) {
    const isAssigned = await locationsRepo.isUserAssignedToLocation(actor.id, id);
    if (!isAssigned) throw new ForbiddenError();
  }

  if (actor.role === Role.FRANCHISE_MANAGER && existing.franchiseId !== actor.franchiseId) {
    throw new ForbiddenError();
  }

  return locationsRepo.updateAssignments(id, dto.userIds);
}

export async function deleteLocation(id: string, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.FRANCHISE_MANAGER) throw new ForbiddenError();

  const existing = await locationsRepo.findById(id);
  if (!existing) throw new NotFoundError('Location');

  if (actor.role === Role.FRANCHISE_MANAGER && existing.franchiseId !== actor.franchiseId) {
    throw new ForbiddenError();
  }

  return locationsRepo.remove(id);
}

export async function getDashboardStats() {
  return { total: await locationsRepo.countAll() };
}
