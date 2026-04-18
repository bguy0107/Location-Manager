import { RequestingParty, RequestStatus } from '@prisma/client';
import * as repo from './surveillance.repository';
import {
  CreateSurveillanceRequestDto,
  UpdateSurveillanceRequestDto,
  SurveillanceQuery,
} from './surveillance.schemas';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedUser, Role } from '../../types';
import { buildPaginatedResponse } from '../../utils/pagination';

export async function getSurveillanceRequests(query: SurveillanceQuery, actor: AuthenticatedUser) {
  const skip = (query.page - 1) * query.limit;
  const userId = actor.role === Role.USER ? actor.id : undefined;

  const { data, total } = await repo.findMany({
    skip,
    take: query.limit,
    userId,
    locationId: query.locationId,
    status: query.status as RequestStatus | undefined,
  });

  return buildPaginatedResponse(data, total, { page: query.page, limit: query.limit, skip });
}

export async function getSurveillanceRequestById(id: string, actor: AuthenticatedUser) {
  const request = await repo.findById(id);
  if (!request) throw new NotFoundError('Surveillance request');

  if (actor.role === Role.USER) {
    const inScope = await repo.isRequestInUserLocations(id, actor.id);
    if (!inScope) throw new NotFoundError('Surveillance request');
  }

  return request;
}

export async function createSurveillanceRequest(
  dto: CreateSurveillanceRequestDto,
  actor: AuthenticatedUser
) {
  if (actor.role === Role.USER || actor.role === Role.MANAGER) {
    const assigned = await repo.isUserAssignedToLocation(actor.id, dto.locationId);
    if (!assigned) throw new ForbiddenError();
  }

  return repo.create({
    locationId: dto.locationId,
    requestedById: actor.id,
    requestingParty: dto.requestingParty as RequestingParty,
    footageStartAt: dto.footageStartAt,
    footageEndAt: dto.footageEndAt,
    cameras: dto.cameras,
    notes: dto.notes,
  });
}

export async function updateSurveillanceStatus(
  id: string,
  dto: UpdateSurveillanceRequestDto,
  actor: AuthenticatedUser,
) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Surveillance request');
  return repo.updateStatus(id, dto.status as RequestStatus, actor.id, existing.status);
}

export async function deleteSurveillanceRequest(id: string, _actor: AuthenticatedUser) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Surveillance request');
  return repo.remove(id);
}
