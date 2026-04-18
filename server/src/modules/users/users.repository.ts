import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  franchiseId: true,
  createdAt: true,
  updatedAt: true,
  locations: {
    select: {
      location: {
        select: { id: true, name: true, storeNumber: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UserWithLocations = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export async function findMany(params: {
  skip: number;
  take: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  franchiseId?: string;
}) {
  const where: Prisma.UserWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.role) where.role = params.role as any;
  if (params.isActive !== undefined) where.isActive = params.isActive;
  if (params.franchiseId) {
    where.locations = {
      some: { location: { franchiseId: params.franchiseId } },
    };
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function create(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  locationIds: string[];
  franchiseId?: string | null;
}) {
  const { locationIds, ...userData } = data;
  return prisma.user.create({
    data: {
      ...userData,
      role: userData.role as any,
      locations: {
        create: locationIds.map((locationId) => ({ locationId })),
      },
    },
    select: userSelect,
  });
}

export async function update(
  id: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
    locationIds?: string[];
    franchiseId?: string | null;
  }
) {
  const { locationIds, ...userData } = data;

  return prisma.$transaction(async (tx) => {
    if (locationIds !== undefined) {
      await tx.userLocation.deleteMany({ where: { userId: id } });
      if (locationIds.length > 0) {
        await tx.userLocation.createMany({
          data: locationIds.map((locationId) => ({ userId: id, locationId })),
        });
      }
    }

    return tx.user.update({
      where: { id },
      data: { ...userData, role: userData.role as any },
      select: userSelect,
    });
  });
}

export async function remove(id: string) {
  return prisma.user.delete({ where: { id }, select: { id: true } });
}

export async function countAll() {
  return prisma.user.count();
}

export async function countActive() {
  return prisma.user.count({ where: { isActive: true } });
}

export async function hasLocationInFranchise(userId: string, franchiseId: string) {
  const row = await prisma.userLocation.findFirst({
    where: { userId, location: { franchiseId } },
    select: { userId: true },
  });
  return row !== null;
}
