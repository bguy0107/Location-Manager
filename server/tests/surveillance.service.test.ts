import { Role } from '../src/types';
import { NotFoundError, ForbiddenError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    surveillanceRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userLocation: {
      findUnique: jest.fn(),
    },
    surveillanceStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../src/utils/prisma';
import * as surveillanceService from '../src/modules/surveillance/surveillance.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const adminActor = { id: 'admin-id', email: 'admin@test.com', role: Role.ADMIN };
const managerActor = { id: 'manager-id', email: 'manager@test.com', role: Role.MANAGER };
const userActor = { id: 'user-id', email: 'user@test.com', role: Role.USER };
const technicianActor = { id: 'tech-id', email: 'tech@test.com', role: Role.TECHNICIAN };

const mockRequest = {
  id: 'req-1',
  requestingParty: 'LAW_ENFORCEMENT' as const,
  status: 'PENDING' as const,
  footageStartAt: new Date('2024-01-01T00:00:00Z'),
  footageEndAt: new Date('2024-01-01T02:00:00Z'),
  cameras: [1, 2],
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  location: { id: 'loc-1', name: 'Test Store', storeNumber: 'STR-001' },
  requestedBy: { id: 'user-id', name: 'Test User', email: 'user@test.com' },
  statusHistory: [],
};

const createDto = {
  locationId: 'loc-1',
  requestingParty: 'LAW_ENFORCEMENT' as const,
  footageStartAt: new Date('2024-01-01T00:00:00Z'),
  footageEndAt: new Date('2024-01-01T02:00:00Z'),
  cameras: [1, 2],
};

beforeEach(() => {
  jest.clearAllMocks();
  (mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => callback(mockPrisma)
  );
});

describe('surveillanceService.getSurveillanceRequests', () => {
  it('returns all requests for ADMIN without userId filter', async () => {
    (mockPrisma.surveillanceRequest.findMany as jest.Mock).mockResolvedValue([mockRequest]);
    (mockPrisma.surveillanceRequest.count as jest.Mock).mockResolvedValue(1);

    const result = await surveillanceService.getSurveillanceRequests({ page: 1, limit: 20 }, adminActor);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockPrisma.surveillanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('filters by userId for USER role', async () => {
    (mockPrisma.surveillanceRequest.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.surveillanceRequest.count as jest.Mock).mockResolvedValue(0);

    await surveillanceService.getSurveillanceRequests({ page: 1, limit: 20 }, userActor);

    expect(mockPrisma.surveillanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          location: { users: { some: { userId: 'user-id' } } },
        }),
      })
    );
  });

  it('returns all requests for MANAGER without userId filter', async () => {
    (mockPrisma.surveillanceRequest.findMany as jest.Mock).mockResolvedValue([mockRequest]);
    (mockPrisma.surveillanceRequest.count as jest.Mock).mockResolvedValue(1);

    await surveillanceService.getSurveillanceRequests({ page: 1, limit: 20 }, managerActor);

    expect(mockPrisma.surveillanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('filters by userId for TECHNICIAN role', async () => {
    (mockPrisma.surveillanceRequest.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.surveillanceRequest.count as jest.Mock).mockResolvedValue(0);

    await surveillanceService.getSurveillanceRequests({ page: 1, limit: 20 }, technicianActor);

    expect(mockPrisma.surveillanceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          location: { users: { some: { userId: 'tech-id' } } },
        }),
      })
    );
  });
});

describe('surveillanceService.getSurveillanceRequestById', () => {
  it('returns request when found for ADMIN', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);

    const result = await surveillanceService.getSurveillanceRequestById('req-1', adminActor);

    expect(result.id).toBe('req-1');
  });

  it('throws NotFoundError when request does not exist', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.getSurveillanceRequestById('nonexistent', adminActor)
    ).rejects.toThrow(NotFoundError);
  });

  it('returns request for USER when their location matches', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'req-1' });

    const result = await surveillanceService.getSurveillanceRequestById('req-1', userActor);

    expect(result.id).toBe('req-1');
  });

  it('throws NotFoundError for USER when request is not in their locations', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.getSurveillanceRequestById('req-1', userActor)
    ).rejects.toThrow(NotFoundError);
  });

  it('returns request for TECHNICIAN when their location matches', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'req-1' });

    const result = await surveillanceService.getSurveillanceRequestById('req-1', technicianActor);

    expect(result.id).toBe('req-1');
  });

  it('throws NotFoundError for TECHNICIAN when request is not in their locations', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.getSurveillanceRequestById('req-1', technicianActor)
    ).rejects.toThrow(NotFoundError);
  });
});

describe('surveillanceService.createSurveillanceRequest', () => {
  it('creates request for ADMIN without assignment check', async () => {
    (mockPrisma.surveillanceRequest.create as jest.Mock).mockResolvedValue(mockRequest);

    const result = await surveillanceService.createSurveillanceRequest(createDto, adminActor);

    expect(result.id).toBe('req-1');
    expect(mockPrisma.userLocation.findUnique).not.toHaveBeenCalled();
  });

  it('creates request for USER when assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-id' });
    (mockPrisma.surveillanceRequest.create as jest.Mock).mockResolvedValue(mockRequest);

    const result = await surveillanceService.createSurveillanceRequest(createDto, userActor);

    expect(result.id).toBe('req-1');
  });

  it('throws ForbiddenError for USER when not assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.createSurveillanceRequest(createDto, userActor)
    ).rejects.toThrow(ForbiddenError);
  });

  it('creates request for MANAGER when assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue({ userId: 'manager-id' });
    (mockPrisma.surveillanceRequest.create as jest.Mock).mockResolvedValue(mockRequest);

    const result = await surveillanceService.createSurveillanceRequest(createDto, managerActor);

    expect(result.id).toBe('req-1');
  });

  it('throws ForbiddenError for MANAGER when not assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.createSurveillanceRequest(createDto, managerActor)
    ).rejects.toThrow(ForbiddenError);
  });

  it('creates request for TECHNICIAN when assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue({ userId: 'tech-id' });
    (mockPrisma.surveillanceRequest.create as jest.Mock).mockResolvedValue(mockRequest);

    const result = await surveillanceService.createSurveillanceRequest(createDto, technicianActor);

    expect(result.id).toBe('req-1');
  });

  it('throws ForbiddenError for TECHNICIAN when not assigned to location', async () => {
    (mockPrisma.userLocation.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.createSurveillanceRequest(createDto, technicianActor)
    ).rejects.toThrow(ForbiddenError);
  });
});

describe('surveillanceService.updateSurveillanceStatus', () => {
  it('updates status successfully', async () => {
    const updated = { ...mockRequest, status: 'IN_PROGRESS' as const };
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceStatusHistory.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.surveillanceRequest.update as jest.Mock).mockResolvedValue(updated);

    const result = await surveillanceService.updateSurveillanceStatus(
      'req-1',
      { status: 'IN_PROGRESS' },
      adminActor
    );

    expect(result.status).toBe('IN_PROGRESS');
  });

  it('throws NotFoundError when request does not exist', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.updateSurveillanceStatus('nonexistent', { status: 'IN_PROGRESS' }, adminActor)
    ).rejects.toThrow(NotFoundError);
  });

  it('updates status for TECHNICIAN when assigned to the request location', async () => {
    const updated = { ...mockRequest, status: 'IN_PROGRESS' as const };
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'req-1' });
    (mockPrisma.surveillanceStatusHistory.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.surveillanceRequest.update as jest.Mock).mockResolvedValue(updated);

    const result = await surveillanceService.updateSurveillanceStatus(
      'req-1',
      { status: 'IN_PROGRESS' },
      technicianActor
    );

    expect(result.status).toBe('IN_PROGRESS');
  });

  it('throws ForbiddenError for TECHNICIAN when not assigned to the request location', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.updateSurveillanceStatus('req-1', { status: 'IN_PROGRESS' }, technicianActor)
    ).rejects.toThrow(ForbiddenError);
  });
});

describe('surveillanceService.deleteSurveillanceRequest', () => {
  it('deletes request successfully', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(mockRequest);
    (mockPrisma.surveillanceRequest.delete as jest.Mock).mockResolvedValue({ id: 'req-1' });

    await expect(
      surveillanceService.deleteSurveillanceRequest('req-1', adminActor)
    ).resolves.not.toThrow();
  });

  it('throws NotFoundError when request does not exist', async () => {
    (mockPrisma.surveillanceRequest.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      surveillanceService.deleteSurveillanceRequest('nonexistent', adminActor)
    ).rejects.toThrow(NotFoundError);
  });
});
