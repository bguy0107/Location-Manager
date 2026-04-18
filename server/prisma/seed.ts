import { PrismaClient, Role, FranchiseStatus, RequestingParty, RequestStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const SALT_ROUNDS = 12;

  // Clear existing data (order matters due to foreign keys)
  await prisma.surveillanceStatusHistory.deleteMany();
  await prisma.surveillanceRequest.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.location.deleteMany();
  await prisma.franchise.deleteMany();
  await prisma.user.deleteMany();

  // ── Passwords ─────────────────────────────────────────────────────────────
  const adminPassword         = await bcrypt.hash('Admin123!',           SALT_ROUNDS);
  const franchiseMgrPassword  = await bcrypt.hash('Franchise123!',       SALT_ROUNDS);
  const managerPassword       = await bcrypt.hash('Manager123!',         SALT_ROUNDS);
  const userPassword          = await bcrypt.hash('User123!',            SALT_ROUNDS);
  const technicianPassword    = await bcrypt.hash('Technician123!',      SALT_ROUNDS);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // ── Franchise Owners (created before franchises so we have their IDs) ──────
  const franchiseOwner1 = await prisma.user.create({
    data: {
      name: 'Frank East',
      email: 'frank.east@example.com',
      password: franchiseMgrPassword,
      role: Role.FRANCHISE_MANAGER,
    },
  });

  const franchiseOwner2 = await prisma.user.create({
    data: {
      name: 'Wendy West',
      email: 'wendy.west@example.com',
      password: franchiseMgrPassword,
      role: Role.FRANCHISE_MANAGER,
    },
  });

  // ── Franchises ─────────────────────────────────────────────────────────────
  const franchiseEast = await prisma.franchise.create({
    data: {
      name: 'East Coast Franchise',
      status: FranchiseStatus.ACTIVE,
      ownerId: franchiseOwner1.id,
    },
  });

  const franchiseWest = await prisma.franchise.create({
    data: {
      name: 'West Coast Franchise',
      status: FranchiseStatus.ACTIVE,
      ownerId: franchiseOwner2.id,
    },
  });

  // Link franchise managers to their franchise
  await prisma.user.update({
    where: { id: franchiseOwner1.id },
    data: { franchiseId: franchiseEast.id },
  });

  await prisma.user.update({
    where: { id: franchiseOwner2.id },
    data: { franchiseId: franchiseWest.id },
  });

  // ── Locations ─────────────────────────────────────────────────────────────
  const locations = await Promise.all([
    // East Coast Franchise locations
    prisma.location.create({
      data: {
        name: 'Downtown Store',
        storeNumber: 'STR-001',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        notes: 'Flagship store',
        franchiseId: franchiseEast.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'East Point',
        storeNumber: 'STR-005',
        address: '654 East St',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        notes: 'High traffic location',
        franchiseId: franchiseEast.id,
      },
    }),
    // West Coast Franchise locations
    prisma.location.create({
      data: {
        name: 'Westside Mall',
        storeNumber: 'STR-002',
        address: '456 West Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        franchiseId: franchiseWest.id,
      },
    }),
    prisma.location.create({
      data: {
        name: 'North Plaza',
        storeNumber: 'STR-003',
        address: '789 North Ave',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        notes: 'Recently renovated',
        franchiseId: franchiseWest.id,
      },
    }),
    // Unaffiliated location
    prisma.location.create({
      data: {
        name: 'South Center',
        storeNumber: 'STR-004',
        address: '321 South Rd',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
      },
    }),
  ]);

  // Convenient aliases
  const [locNY, locFL, locCA, locIL, locTX] = locations;

  // ── Managers & Users ───────────────────────────────────────────────────────
  const manager1 = await prisma.user.create({
    data: {
      name: 'Manager One',
      email: 'manager1@example.com',
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Manager Two',
      email: 'manager2@example.com',
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  const regularUsers = await Promise.all([
    prisma.user.create({
      data: { name: 'Alice Johnson', email: 'user1@example.com', password: userPassword, role: Role.USER },
    }),
    prisma.user.create({
      data: { name: 'Bob Smith',     email: 'user2@example.com', password: userPassword, role: Role.USER },
    }),
    prisma.user.create({
      data: { name: 'Carol White',   email: 'user3@example.com', password: userPassword, role: Role.USER },
    }),
    prisma.user.create({
      data: { name: 'David Brown',   email: 'user4@example.com', password: userPassword, role: Role.USER },
    }),
    prisma.user.create({
      data: { name: 'Eva Martinez',  email: 'user5@example.com', password: userPassword, role: Role.USER },
    }),
  ]);

  const technicians = await Promise.all([
    prisma.user.create({
      data: { name: 'Tech One',   email: 'tech1@example.com', password: technicianPassword, role: Role.TECHNICIAN },
    }),
    prisma.user.create({
      data: { name: 'Tech Two',   email: 'tech2@example.com', password: technicianPassword, role: Role.TECHNICIAN },
    }),
    prisma.user.create({
      data: { name: 'Tech Three', email: 'tech3@example.com', password: technicianPassword, role: Role.TECHNICIAN },
    }),
  ]);

  // ── Assignments ────────────────────────────────────────────────────────────
  await prisma.userLocation.createMany({
    data: [
      // Admin sees all
      { userId: admin.id, locationId: locNY.id },
      { userId: admin.id, locationId: locFL.id },
      // Franchise manager East → their franchise locations
      { userId: franchiseOwner1.id, locationId: locNY.id },
      { userId: franchiseOwner1.id, locationId: locFL.id },
      // Franchise manager West → their franchise locations
      { userId: franchiseOwner2.id, locationId: locCA.id },
      { userId: franchiseOwner2.id, locationId: locIL.id },
      // Manager 1 handles East Coast locations
      { userId: manager1.id, locationId: locNY.id },
      { userId: manager1.id, locationId: locFL.id },
      // Manager 2 handles West Coast + TX
      { userId: manager2.id, locationId: locCA.id },
      { userId: manager2.id, locationId: locIL.id },
      { userId: manager2.id, locationId: locTX.id },
      // Regular users
      { userId: regularUsers[0].id, locationId: locNY.id },
      { userId: regularUsers[1].id, locationId: locNY.id },
      { userId: regularUsers[1].id, locationId: locFL.id },
      { userId: regularUsers[2].id, locationId: locCA.id },
      { userId: regularUsers[3].id, locationId: locIL.id },
      { userId: regularUsers[4].id, locationId: locTX.id },
      // Technicians — each covers multiple locations
      { userId: technicians[0].id, locationId: locNY.id },
      { userId: technicians[0].id, locationId: locFL.id },
      { userId: technicians[1].id, locationId: locCA.id },
      { userId: technicians[1].id, locationId: locIL.id },
      { userId: technicians[2].id, locationId: locTX.id },
    ],
  });

  // ── Surveillance Requests ──────────────────────────────────────────────────
  const surveillance = await Promise.all([
    // FULFILLED — law enforcement, Downtown Store NY
    prisma.surveillanceRequest.create({
      data: {
        locationId: locNY.id,
        requestedById: manager1.id,
        requestingParty: RequestingParty.LAW_ENFORCEMENT,
        status: RequestStatus.FULFILLED,
        footageStartAt: new Date('2026-03-10T08:00:00Z'),
        footageEndAt:   new Date('2026-03-10T14:00:00Z'),
        cameras: [1, 2, 4],
        notes: 'Officer requested footage related to an incident.',
      },
    }),
    // IN_PROGRESS — insurance, East Point FL
    prisma.surveillanceRequest.create({
      data: {
        locationId: locFL.id,
        requestedById: manager1.id,
        requestingParty: RequestingParty.INSURANCE,
        status: RequestStatus.IN_PROGRESS,
        footageStartAt: new Date('2026-03-28T18:00:00Z'),
        footageEndAt:   new Date('2026-03-28T22:00:00Z'),
        cameras: [3],
        notes: 'Slip-and-fall claim verification.',
      },
    }),
    // PENDING — internal, Westside Mall CA
    prisma.surveillanceRequest.create({
      data: {
        locationId: locCA.id,
        requestedById: manager2.id,
        requestingParty: RequestingParty.INTERNAL,
        status: RequestStatus.PENDING,
        footageStartAt: new Date('2026-04-10T09:00:00Z'),
        footageEndAt:   new Date('2026-04-10T17:00:00Z'),
        cameras: [1, 2, 3, 5],
        notes: 'Inventory shrinkage investigation.',
      },
    }),
    // DENIED — law enforcement, North Plaza IL
    prisma.surveillanceRequest.create({
      data: {
        locationId: locIL.id,
        requestedById: franchiseOwner2.id,
        requestingParty: RequestingParty.LAW_ENFORCEMENT,
        status: RequestStatus.DENIED,
        footageStartAt: new Date('2026-02-14T00:00:00Z'),
        footageEndAt:   new Date('2026-02-14T23:59:00Z'),
        cameras: [2],
        notes: 'Request lacked required warrant documentation.',
      },
    }),
    // PENDING — insurance, South Center TX
    prisma.surveillanceRequest.create({
      data: {
        locationId: locTX.id,
        requestedById: admin.id,
        requestingParty: RequestingParty.INSURANCE,
        status: RequestStatus.PENDING,
        footageStartAt: new Date('2026-04-15T12:00:00Z'),
        footageEndAt:   new Date('2026-04-15T16:00:00Z'),
        cameras: [1],
      },
    }),
    // FULFILLED — internal, Downtown Store NY
    prisma.surveillanceRequest.create({
      data: {
        locationId: locNY.id,
        requestedById: admin.id,
        requestingParty: RequestingParty.INTERNAL,
        status: RequestStatus.FULFILLED,
        footageStartAt: new Date('2026-01-20T07:00:00Z'),
        footageEndAt:   new Date('2026-01-20T09:00:00Z'),
        cameras: [1, 3],
        notes: 'Routine compliance audit footage.',
      },
    }),
  ]);

  // Status history for requests that progressed beyond PENDING
  await prisma.surveillanceStatusHistory.createMany({
    data: [
      // Request 0: PENDING → IN_PROGRESS → FULFILLED
      { requestId: surveillance[0].id, changedById: admin.id, fromStatus: RequestStatus.PENDING,     toStatus: RequestStatus.IN_PROGRESS, changedAt: new Date('2026-03-11T09:00:00Z') },
      { requestId: surveillance[0].id, changedById: admin.id, fromStatus: RequestStatus.IN_PROGRESS, toStatus: RequestStatus.FULFILLED,   changedAt: new Date('2026-03-12T11:00:00Z') },
      // Request 1: PENDING → IN_PROGRESS
      { requestId: surveillance[1].id, changedById: admin.id, fromStatus: RequestStatus.PENDING,     toStatus: RequestStatus.IN_PROGRESS, changedAt: new Date('2026-03-29T10:00:00Z') },
      // Request 3: PENDING → DENIED
      { requestId: surveillance[3].id, changedById: admin.id, fromStatus: RequestStatus.PENDING,     toStatus: RequestStatus.DENIED,      changedAt: new Date('2026-02-16T14:00:00Z') },
      // Request 5: PENDING → IN_PROGRESS → FULFILLED
      { requestId: surveillance[5].id, changedById: admin.id, fromStatus: RequestStatus.PENDING,     toStatus: RequestStatus.IN_PROGRESS, changedAt: new Date('2026-01-21T08:00:00Z') },
      { requestId: surveillance[5].id, changedById: admin.id, fromStatus: RequestStatus.IN_PROGRESS, toStatus: RequestStatus.FULFILLED,   changedAt: new Date('2026-01-22T10:00:00Z') },
    ],
  });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Credentials:');
  console.log('  Admin:             admin@example.com        / Admin123!');
  console.log('  Franchise Mgr East: frank.east@example.com  / Franchise123!');
  console.log('  Franchise Mgr West: wendy.west@example.com  / Franchise123!');
  console.log('  Manager:           manager1@example.com     / Manager123!');
  console.log('  Manager:           manager2@example.com     / Manager123!');
  console.log('  User:              user1@example.com        / User123!');
  console.log('  (users 2–5 follow the same pattern)');
  console.log('  Technician:        tech1@example.com        / Technician123!');
  console.log('  (techs 2–3 follow the same pattern)\n');
  console.log('Franchises:');
  console.log('  East Coast Franchise → NY (STR-001), FL (STR-005)');
  console.log('  West Coast Franchise → CA (STR-002), IL (STR-003)');
  console.log('  No franchise        → TX (STR-004)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
