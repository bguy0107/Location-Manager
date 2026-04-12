import bcrypt from 'bcrypt';
import * as usersRepo from './users.repository';
import { CreateUserDto, UpdateUserDto, UsersQuery } from './users.schemas';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { AuthenticatedUser, Role } from '../../types';
import { buildPaginatedResponse } from '../../utils/pagination';

const SALT_ROUNDS = 12;

export async function getUsers(query: UsersQuery) {
  const skip = (query.page - 1) * query.limit;

  const { data, total } = await usersRepo.findMany({
    skip,
    take: query.limit,
    search: query.search,
    role: query.role,
    isActive: query.isActive,
  });

  return buildPaginatedResponse(data, total, { page: query.page, limit: query.limit, skip });
}

export async function getUserById(id: string) {
  const user = await usersRepo.findById(id);
  if (!user) throw new NotFoundError('User');
  return user;
}

export async function createUser(dto: CreateUserDto, actor: AuthenticatedUser) {
  // MANAGER cannot create ADMIN users
  if (actor.role === Role.MANAGER && dto.role === Role.ADMIN) {
    throw new ForbiddenError('Managers cannot create admin users');
  }

  const existing = await usersRepo.findByEmail(dto.email);
  if (existing) throw new ConflictError('Email already in use');

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  return usersRepo.create({
    name: dto.name,
    email: dto.email,
    password: hashedPassword,
    role: dto.role,
    isActive: dto.isActive,
    locationIds: dto.locationIds,
  });
}

export async function updateUser(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
  const existing = await usersRepo.findById(id);
  if (!existing) throw new NotFoundError('User');

  // MANAGER cannot change a user to ADMIN or modify an ADMIN
  if (actor.role === Role.MANAGER) {
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenError('Managers cannot assign admin role');
    }
    if (existing.role === Role.ADMIN) {
      throw new ForbiddenError('Managers cannot modify admin users');
    }
  }

  // If email is changing, check it's not taken
  if (dto.email && dto.email !== existing.email) {
    const taken = await usersRepo.findByEmail(dto.email);
    if (taken) throw new ConflictError('Email already in use');
  }

  let hashedPassword: string | undefined;
  if (dto.password) {
    hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  }

  return usersRepo.update(id, {
    name: dto.name,
    email: dto.email,
    password: hashedPassword,
    role: dto.role,
    isActive: dto.isActive,
    locationIds: dto.locationIds,
  });
}

export async function deleteUser(id: string, actor: AuthenticatedUser) {
  if (actor.id === id) {
    throw new BadRequestError('You cannot delete your own account');
  }

  const existing = await usersRepo.findById(id);
  if (!existing) throw new NotFoundError('User');

  return usersRepo.remove(id);
}

export async function getDashboardStats() {
  const [total, active] = await Promise.all([
    usersRepo.countAll(),
    usersRepo.countActive(),
  ]);
  return { total, active };
}
