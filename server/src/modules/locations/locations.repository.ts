import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';

const locationSelect = {
  id: true,
  name: true,
  storeNumber: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  notes: true,
  franchiseId: true,
  createdAt: true,
  updatedAt: true,
  franchise: {
    select: { id: true, name: true },
  },
  users: {
    select: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  },
} satisfies Prisma.LocationSelect;

export type LocationWithUsers = Prisma.LocationGetPayload<{ select: typeof locationSelect }>;

export async function findMany(params: {
  skip: number;
  take: number;
  search?: string;
  state?: string;
  city?: string;
  userId?: string;
  franchiseId?: string;
}) {
  const where: Prisma.LocationWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { storeNumber: { contains: params.search, mode: 'insensitive' } },
      { address: { contains: params.search, mode: 'insensitive' } },
      { city: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.state) where.state = { equals: params.state, mode: 'insensitive' };
  if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
  if (params.userId) {
    where.users = { some: { userId: params.userId } };
  }
  if (params.franchiseId) {
    where.franchiseId = params.franchiseId;
  }

  const [data, total] = await Promise.all([
    prisma.location.findMany({
      where,
      select: locationSelect,
      skip: params.skip,
      take: params.take,
      orderBy: { name: 'asc' },
    }),
    prisma.location.count({ where }),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  return prisma.location.findUnique({ where: { id }, select: locationSelect });
}

export async function create(data: {
  name: string;
  storeNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  userIds: string[];
  franchiseId?: string | null;
}) {
  const { userIds, ...locationData } = data;
  return prisma.location.create({
    data: {
      ...locationData,
      users: {
        create: userIds.map((userId) => ({ userId })),
      },
    },
    select: locationSelect,
  });
}

export async function update(
  id: string,
  data: {
    name?: string;
    storeNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string | null;
    userIds?: string[];
    franchiseId?: string | null;
  }
) {
  const { userIds, ...locationData } = data;

  return prisma.$transaction(async (tx) => {
    if (userIds !== undefined) {
      await tx.userLocation.deleteMany({ where: { locationId: id } });
      if (userIds.length > 0) {
        await tx.userLocation.createMany({
          data: userIds.map((userId) => ({ locationId: id, userId })),
        });
      }
    }

    return tx.location.update({
      where: { id },
      data: locationData,
      select: locationSelect,
    });
  });
}

export async function remove(id: string) {
  return prisma.location.delete({ where: { id }, select: { id: true } });
}

export async function isUserAssignedToLocation(userId: string, locationId: string) {
  const row = await prisma.userLocation.findUnique({
    where: { userId_locationId: { userId, locationId } },
    select: { userId: true },
  });
  return row !== null;
}

export async function updateAssignments(id: string, userIds: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.userLocation.deleteMany({ where: { locationId: id } });
    if (userIds.length > 0) {
      await tx.userLocation.createMany({
        data: userIds.map((userId) => ({ locationId: id, userId })),
      });
    }
    return tx.location.findUniqueOrThrow({ where: { id }, select: locationSelect });
  });
}

export async function countAll() {
  return prisma.location.count();
}
