import { Role } from '../src/types';
import { NotFoundError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    location: {
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

import { prisma } from '../src/utils/prisma';
import * as locationsService from '../src/modules/locations/locations.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const adminActor = { id: 'admin-id', email: 'admin@test.com', role: Role.ADMIN };
const userActor = { id: 'user-id', email: 'user@test.com', role: Role.USER };

const mockLocation = {
  id: 'loc-1',
  name: 'Test Store',
  storeNumber: 'STR-001',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  users: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('locationsService.getLocations', () => {
  it('returns all locations for ADMIN', async () => {
    (mockPrisma.location.findMany as jest.Mock).mockResolvedValue([mockLocation]);
    (mockPrisma.location.count as jest.Mock).mockResolvedValue(1);

    const result = await locationsService.getLocations({ page: 1, limit: 20 }, adminActor);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('filters by userId for USER role', async () => {
    (mockPrisma.location.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.location.count as jest.Mock).mockResolvedValue(0);

    await locationsService.getLocations({ page: 1, limit: 20 }, userActor);

    // Verify findMany was called with userId filter
    expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          users: { some: { userId: 'user-id' } },
        }),
      })
    );
  });
});

describe('locationsService.getLocationById', () => {
  it('returns location when found for ADMIN', async () => {
    (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    const result = await locationsService.getLocationById('loc-1', adminActor);
    expect(result.name).toBe('Test Store');
  });

  it('throws NotFoundError when location does not exist', async () => {
    (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(
      locationsService.getLocationById('nonexistent', adminActor)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when USER is not assigned to the location', async () => {
    (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue({
      ...mockLocation,
      users: [{ user: { id: 'other-user-id', name: 'Other', email: 'o@o.com', role: 'USER' } }],
    });

    await expect(
      locationsService.getLocationById('loc-1', userActor)
    ).rejects.toThrow(NotFoundError);
  });
});

describe('locationsService.deleteLocation', () => {
  it('throws NotFoundError when location does not exist', async () => {
    (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(locationsService.deleteLocation('nonexistent', adminActor)).rejects.toThrow(NotFoundError);
  });

  it('deletes location successfully', async () => {
    (mockPrisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    (mockPrisma.location.delete as jest.Mock).mockResolvedValue({ id: 'loc-1' });

    await expect(locationsService.deleteLocation('loc-1', adminActor)).resolves.not.toThrow();
  });
});
