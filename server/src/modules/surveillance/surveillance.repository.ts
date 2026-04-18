import { Prisma, RequestingParty, RequestStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';

const surveillanceSelect = {
  id: true,
  requestingParty: true,
  status: true,
  footageStartAt: true,
  footageEndAt: true,
  cameras: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  location: {
    select: { id: true, name: true, storeNumber: true },
  },
  requestedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.SurveillanceRequestSelect;

const statusHistorySelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  changedAt: true,
  changedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.SurveillanceStatusHistorySelect;

const surveillanceDetailSelect = {
  ...surveillanceSelect,
  statusHistory: {
    select: statusHistorySelect,
    orderBy: { changedAt: 'asc' as const },
  },
} satisfies Prisma.SurveillanceRequestSelect;

export type SurveillanceRequestWithDetails = Prisma.SurveillanceRequestGetPayload<{
  select: typeof surveillanceSelect;
}>;

export type SurveillanceRequestWithHistory = Prisma.SurveillanceRequestGetPayload<{
  select: typeof surveillanceDetailSelect;
}>;

export async function findMany(params: {
  skip: number;
  take: number;
  userId?: string;
  locationId?: string;
  status?: RequestStatus;
}) {
  const where: Prisma.SurveillanceRequestWhereInput = {
    ...(params.userId && { location: { users: { some: { userId: params.userId } } } }),
    ...(params.locationId && { locationId: params.locationId }),
    ...(params.status && { status: params.status }),
  };

  const [data, total] = await Promise.all([
    prisma.surveillanceRequest.findMany({
      where,
      select: surveillanceSelect,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.surveillanceRequest.count({ where }),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  return prisma.surveillanceRequest.findUnique({
    where: { id },
    select: surveillanceDetailSelect,
  });
}

export async function isUserAssignedToLocation(userId: string, locationId: string) {
  const row = await prisma.userLocation.findUnique({
    where: { userId_locationId: { userId, locationId } },
    select: { userId: true },
  });
  return row !== null;
}

export async function isRequestInUserLocations(requestId: string, userId: string) {
  const row = await prisma.surveillanceRequest.findFirst({
    where: { id: requestId, location: { users: { some: { userId } } } },
    select: { id: true },
  });
  return row !== null;
}

export async function create(data: {
  locationId: string;
  requestedById: string;
  requestingParty: RequestingParty;
  footageStartAt: Date;
  footageEndAt: Date;
  cameras: number[];
  notes?: string;
}) {
  return prisma.surveillanceRequest.create({ data, select: surveillanceSelect });
}

export async function updateStatus(
  id: string,
  status: RequestStatus,
  changedById: string,
  fromStatus: RequestStatus,
) {
  return prisma.$transaction(async (tx) => {
    await tx.surveillanceStatusHistory.create({
      data: { requestId: id, changedById, fromStatus, toStatus: status },
    });
    return tx.surveillanceRequest.update({
      where: { id },
      data: { status },
      select: surveillanceDetailSelect,
    });
  });
}

export async function remove(id: string) {
  return prisma.surveillanceRequest.delete({ where: { id }, select: { id: true } });
}
