import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const SALT_ROUNDS = 12;

  // Clear existing data (order matters due to foreign keys)
  await prisma.refreshToken.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // ── Locations ─────────────────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Downtown Store',
        storeNumber: 'STR-001',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        notes: 'Flagship store',
      },
    }),
    prisma.location.create({
      data: {
        name: 'Westside Mall',
        storeNumber: 'STR-002',
        address: '456 West Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
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
      },
    }),
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
    prisma.location.create({
      data: {
        name: 'East Point',
        storeNumber: 'STR-005',
        address: '654 East St',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        notes: 'High traffic location',
      },
    }),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const managerPassword = await bcrypt.hash('Manager123!', SALT_ROUNDS);
  const userPassword = await bcrypt.hash('User123!', SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

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
      data: {
        name: 'Alice Johnson',
        email: 'user1@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'user2@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carol White',
        email: 'user3@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Brown',
        email: 'user4@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Eva Martinez',
        email: 'user5@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
  ]);

  // ── Assignments ────────────────────────────────────────────────────────────
  const assignments = [
    // Admin gets all locations
    { userId: admin.id, locationId: locations[0].id },
    { userId: admin.id, locationId: locations[1].id },
    // Manager 1 handles NY and CA
    { userId: manager1.id, locationId: locations[0].id },
    { userId: manager1.id, locationId: locations[1].id },
    // Manager 2 handles IL, TX, FL
    { userId: manager2.id, locationId: locations[2].id },
    { userId: manager2.id, locationId: locations[3].id },
    { userId: manager2.id, locationId: locations[4].id },
    // Regular users assigned to various locations
    { userId: regularUsers[0].id, locationId: locations[0].id },
    { userId: regularUsers[1].id, locationId: locations[0].id },
    { userId: regularUsers[1].id, locationId: locations[1].id },
    { userId: regularUsers[2].id, locationId: locations[2].id },
    { userId: regularUsers[3].id, locationId: locations[3].id },
    { userId: regularUsers[4].id, locationId: locations[4].id },
  ];

  await prisma.userLocation.createMany({ data: assignments });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Seed credentials:');
  console.log('  Admin:    admin@example.com    / Admin123!');
  console.log('  Manager:  manager1@example.com / Manager123!');
  console.log('  Manager:  manager2@example.com / Manager123!');
  console.log('  User:     user1@example.com    / User123!');
  console.log('  (users 2-5 follow the same pattern)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
