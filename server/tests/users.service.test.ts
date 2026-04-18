import { Role } from '../src/types';
import { ForbiddenError, ConflictError, BadRequestError, NotFoundError } from '../src/utils/errors';

// Mock Prisma and bcrypt before importing service
jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userLocation: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

import { prisma } from '../src/utils/prisma';
import * as usersService from '../src/modules/users/users.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const adminActor = { id: 'admin-id', email: 'admin@test.com', role: Role.ADMIN };
const managerActor = { id: 'manager-id', email: 'manager@test.com', role: Role.MANAGER };

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: Role.USER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  locations: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usersService.getUsers', () => {
  it('returns paginated users list', async () => {
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
    (mockPrisma.user.count as jest.Mock).mockResolvedValue(1);

    const result = await usersService.getUsers({ page: 1, limit: 20 }, adminActor);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});

describe('usersService.getUserById', () => {
  it('returns user when found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const result = await usersService.getUserById('user-1');
    expect(result.email).toBe('test@example.com');
  });

  it('throws NotFoundError when user does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(usersService.getUserById('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

describe('usersService.createUser', () => {
  const createDto = {
    name: 'New User',
    email: 'new@example.com',
    password: 'Password1',
    role: Role.USER,
    isActive: true,
    locationIds: [],
  };

  it('creates a user successfully as admin', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null); // no conflict
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, ...createDto });

    const result = await usersService.createUser(createDto, adminActor);
    expect(result.email).toBe('new@example.com');
  });

  it('throws ConflictError when email is already taken', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser); // email exists
    await expect(usersService.createUser(createDto, adminActor)).rejects.toThrow(ConflictError);
  });

  it('throws ForbiddenError when manager tries to create admin', async () => {
    const adminDto = { ...createDto, role: Role.ADMIN };
    await expect(usersService.createUser(adminDto, managerActor)).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when manager tries to create technician', async () => {
    const techDto = { ...createDto, role: Role.TECHNICIAN };
    await expect(usersService.createUser(techDto, managerActor)).rejects.toThrow(ForbiddenError);
  });

  it('allows admin to create technician', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const techUser = { ...mockUser, role: Role.TECHNICIAN };
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(techUser);

    const result = await usersService.createUser({ ...createDto, role: Role.TECHNICIAN }, adminActor);
    expect(result.role).toBe(Role.TECHNICIAN);
  });
});

describe('usersService.deleteUser', () => {
  it('throws BadRequestError when user tries to delete themselves', async () => {
    await expect(
      usersService.deleteUser('admin-id', adminActor)
    ).rejects.toThrow(BadRequestError);
  });

  it('throws NotFoundError when user does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      usersService.deleteUser('nonexistent', adminActor)
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes user successfully', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (mockPrisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user-1' });

    await expect(
      usersService.deleteUser('user-1', adminActor)
    ).resolves.not.toThrow();
  });
});

describe('usersService.updateUser - MANAGER restrictions', () => {
  it('throws ForbiddenError when manager tries to promote user to admin', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    await expect(
      usersService.updateUser('user-1', { role: Role.ADMIN }, managerActor)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when manager tries to modify an admin user', async () => {
    const adminUser = { ...mockUser, role: Role.ADMIN };
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(adminUser);
    await expect(
      usersService.updateUser('admin-id', { name: 'New Name' }, managerActor)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when manager tries to assign technician role', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    await expect(
      usersService.updateUser('user-1', { role: Role.TECHNICIAN }, managerActor)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when manager tries to modify a technician user', async () => {
    const techUser = { ...mockUser, role: Role.TECHNICIAN };
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(techUser);
    await expect(
      usersService.updateUser('tech-id', { name: 'New Name' }, managerActor)
    ).rejects.toThrow(ForbiddenError);
  });
});
