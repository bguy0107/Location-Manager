# Location Manager

A production-ready, mobile-first web application for managing locations and team members with role-based access control.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + httpOnly cookie refresh tokens |
| Styling | Tailwind CSS |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Logging | Pino |
| Testing | Jest + ts-jest |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running locally)
- npm 9+

## Quick Start

### 1. Clone and Install

```bash
cd "Location Manager3"
npm install
```

This installs all dependencies for both the client and server workspaces, including the Prisma CLI and client (`prisma` and `@prisma/client`).

### 2. Set up the server environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/location_manager
JWT_ACCESS_SECRET=your-access-secret-must-be-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-must-be-at-least-32-characters-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=15d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Set up the client environment

```bash
cp client/.env.local.example client/.env.local
```

`client/.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Set up PostgreSQL

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE location_manager;"
```

Or using pgAdmin / any PostgreSQL GUI, create a database named `location_manager`.

### 5. Run Prisma migrations

```bash
cd server
npm run db:migrate
```

When prompted, give the migration a name (e.g., `init`). This applies the SQL migrations to your database and automatically generates the Prisma client. If you ever need to regenerate the client manually (e.g., after a schema change without a migration), run `npm run db:generate`.

### 6. Seed the database

```bash
npm run db:seed
```

This creates:
- **Admin:** admin@example.com / Admin123!
- **Managers:** manager1@example.com, manager2@example.com / Manager123!
- **Users:** user1–5@example.com / User123!
- **5 sample locations** with user assignments

### 7. Start the app

From the project root:
```bash
cd ..   # back to root if still in /server
npm run dev
```

This starts:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

Open http://localhost:3000 in your browser.

---

## Available Scripts

### Root

| Script | Description |
|---|---|
| `npm run dev` | Start both client and server in development mode |
| `npm run build` | Build both client and server for production |
| `npm run test` | Run server unit tests |

### Server (`cd server`)

| Script | Description |
|---|---|
| `npm run dev` | Start server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset DB and re-seed |
| `npm test` | Run unit tests with coverage |

### Client (`cd client`)

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

---

## Project Structure

```
location-manager/
├── client/           # Next.js 14 App Router frontend
│   └── src/
│       ├── app/      # Pages and layouts
│       ├── components/
│       ├── hooks/    # TanStack Query hooks
│       ├── lib/      # Axios instance, utilities
│       ├── providers/# Auth + QueryClient providers
│       └── types/    # TypeScript types
│
└── server/           # Express + TypeScript backend
    ├── prisma/       # Schema + migrations + seed
    ├── src/
    │   ├── config/   # Validated env config (Zod)
    │   ├── middleware/# Auth, RBAC, error handler, etc.
    │   ├── modules/  # Feature modules (auth, users, locations)
    │   └── utils/    # Logger, JWT, errors, pagination
    └── tests/        # Jest unit tests
```

## API Endpoints

### Auth
```
POST /api/auth/login     — Log in (returns access token + sets cookie)
POST /api/auth/refresh   — Refresh access token using cookie
POST /api/auth/logout    — Log out (clears cookie)
```

### Users (ADMIN, MANAGER)
```
GET    /api/users        — List users (search, filter, paginate)
POST   /api/users        — Create user
GET    /api/users/me     — Get own profile
GET    /api/users/:id    — Get user by ID
PUT    /api/users/:id    — Update user
DELETE /api/users/:id    — Delete user (ADMIN only)
```

### Locations (all authenticated)
```
GET    /api/locations    — List locations (USER sees own, ADMIN/MANAGER see all)
POST   /api/locations    — Create location (ADMIN, MANAGER)
GET    /api/locations/:id— Get location by ID
PUT    /api/locations/:id— Update location (ADMIN, MANAGER)
DELETE /api/locations/:id— Delete location (ADMIN only)
```

### Stats
```
GET /api/stats           — Dashboard statistics (ADMIN, MANAGER)
```

## RBAC

| Permission | ADMIN | MANAGER | USER |
|---|---|---|---|
| Create/edit users | ✓ | ✓ | ✗ |
| Delete users | ✓ | ✗ | ✗ |
| Assign ADMIN role | ✓ | ✗ | ✗ |
| Create/edit locations | ✓ | ✓ | ✗ |
| Delete locations | ✓ | ✗ | ✗ |
| View all locations | ✓ | ✓ | ✗ |
| View own locations | ✓ | ✓ | ✓ |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in DB with 15-day expiry (rotated on each use)
- Refresh token stored as httpOnly + Secure + SameSite=Strict cookie
- Access token stored in memory only (never localStorage)
- Helmet.js security headers
- CORS restricted to configured origin
- Rate limiting: auth (10 req/15min), API (100 req/15min)
- All inputs validated with Zod on server

## Production Deployment

### Server

```bash
cd server
npm run build
NODE_ENV=production npm run start
```

Set `NODE_ENV=production` and use real secrets in `.env`.

### Client

```bash
cd client
npm run build
npm run start
```

Or deploy the Next.js app to Vercel, or any Node.js hosting provider.
