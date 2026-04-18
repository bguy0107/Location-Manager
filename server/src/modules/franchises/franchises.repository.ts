import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';

const franchiseSelect = {
  id: true,
  name: true,
  status: true,
  logoUrl: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: { id: true, name: true, email: true },
  },
  _count: {
    select: { locations: true, managers: true },
  },
} satisfies Prisma.FranchiseSelect;

export type FranchiseWithDetails = Prisma.FranchiseGetPayload<{ select: typeof franchiseSelect }>;

export async function findMany(params: {
  skip: number;
  take: number;
  search?: string;
  status?: string;
}) {
  const where: Prisma.FranchiseWhereInput = {};

  if (params.search) {
    where.name = { contains: params.search, mode: 'insensitive' };
  }
  if (params.status) {
    where.status = params.status as any;
  }

  const [data, total] = await Promise.all([
    prisma.franchise.findMany({
      where,
      select: franchiseSelect,
      skip: params.skip,
      take: params.take,
      orderBy: { name: 'asc' },
    }),
    prisma.franchise.count({ where }),
  ]);

  return { data, total };
}

export async function findById(id: string) {
  return prisma.franchise.findUnique({ where: { id }, select: franchiseSelect });
}

export async function create(data: {
  name: string;
  status: string;
  logoUrl?: string | null;
  ownerId: string;
}) {
  return prisma.franchise.create({
    data: {
      name: data.name,
      status: data.status as any,
      logoUrl: data.logoUrl || null,
      ownerId: data.ownerId,
    },
    select: franchiseSelect,
  });
}

export async function update(
  id: string,
  data: {
    name?: string;
    status?: string;
    logoUrl?: string | null;
    ownerId?: string;
  }
) {
  return prisma.franchise.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
    },
    select: franchiseSelect,
  });
}

export async function remove(id: string) {
  return prisma.franchise.delete({ where: { id }, select: { id: true } });
}

export async function countAll() {
  return prisma.franchise.count();
}
