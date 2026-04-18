import * as locationsRepo from './locations.repository';
import { CreateLocationDto, UpdateLocationDto, UpdateAssignmentsDto, LocationsQuery } from './locations.schemas';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedUser, Role } from '../../types';
import { buildPaginatedResponse } from '../../utils/pagination';

export async function getLocations(query: LocationsQuery, actor: AuthenticatedUser) {
  const skip = (query.page - 1) * query.limit;

  // USER role only sees their assigned locations
  const userId = actor.role === Role.USER ? actor.id : undefined;

  const { data, total } = await locationsRepo.findMany({
    skip,
    take: query.limit,
    search: query.search,
    state: query.state,
    city: query.city,
    userId,
  });

  return buildPaginatedResponse(data, total, { page: query.page, limit: query.limit, skip });
}

export async function getLocationById(id: string, actor: AuthenticatedUser) {
  const location = await locationsRepo.findById(id);
  if (!location) throw new NotFoundError('Location');

  // USER can only view locations they're assigned to
  if (actor.role === Role.USER) {
    const isAssigned = location.users.some((ul) => ul.user.id === actor.id);
    if (!isAssigned) throw new NotFoundError('Location');
  }

  return location;
}

export async function createLocation(dto: CreateLocationDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN) throw new ForbiddenError();

  return locationsRepo.create({
    name: dto.name,
    storeNumber: dto.storeNumber,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zip: dto.zip,
    notes: dto.notes,
    userIds: dto.userIds,
  });
}

export async function updateLocation(id: string, dto: UpdateLocationDto, actor: AuthenticatedUser) {
  if (actor.role !== Role.ADMIN) throw new ForbiddenError();

  const existing = await locationsRepo.findById(id);
  if (!existing) throw new NotFoundError('Location');

  return locationsRepo.update(id, {
    name: dto.name,
    storeNumber: dto.storeNumber,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    zip: dto.zip,
    notes: dto.notes,
    userIds: dto.userIds,
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

  return locationsRepo.updateAssignments(id, dto.userIds);
}

export async function deleteLocation(id: string) {
  const existing = await locationsRepo.findById(id);
  if (!existing) throw new NotFoundError('Location');
  return locationsRepo.remove(id);
}

export async function getDashboardStats() {
  return { total: await locationsRepo.countAll() };
}
