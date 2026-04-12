# CLAUDE.md — Location Manager

This file contains everything needed to continue developing the Location Manager project efficiently. Read this before making any changes.

---

## Project Overview

An internal full-stack web application for managing physical store locations and staff members. Only admins and managers can create users (no self-registration). Regular users get read-only access to their assigned locations.

**Ports:** Frontend → `localhost:3000` | Backend → `localhost:5000`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Backend | Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT access tokens (memory) + httpOnly cookie refresh tokens |
| Styling | Tailwind CSS (mobile-first) |
| State / Data | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Logging | Pino + pino-http |
| Testing | Jest + ts-jest |

---

## Repository Structure

```
/                          ← monorepo root (npm workspaces)
├── CLAUDE.md
├── README.md
├── package.json           ← workspace root; scripts run both packages via concurrently
├── .gitignore
│
├── server/                ← Express API
│   ├── prisma/
│   │   ├── schema.prisma  ← source of truth for DB models
│   │   └── seed.ts        ← seeds sample data (run with npm run db:seed)
│   ├── src/
│   │   ├── server.ts      ← HTTP server entry point
│   │   ├── app.ts         ← Express app, all middleware + route mounting
│   │   ├── config/
│   │   │   └── index.ts   ← Zod-validated env vars; crashes on startup if invalid
│   │   ├── middleware/
│   │   │   ├── auth.ts        ← verifies JWT, attaches req.user
│   │   │   ├── rbac.ts        ← requireRole(...roles) factory
│   │   │   ├── errorHandler.ts← centralized error handler (must stay last in app.ts)
│   │   │   ├── requestLogger.ts
│   │   │   └── rateLimit.ts   ← authLimiter (10/15min) + apiLimiter (100/15min)
│   │   ├── modules/
│   │   │   ├── auth/          ← login, refresh, logout
│   │   │   ├── users/         ← full CRUD
│   │   │   ├── locations/     ← full CRUD
│   │   │   └── stats/         ← dashboard totals
│   │   ├── utils/
│   │   │   ├── errors.ts      ← AppError subclasses (throw these, never res.status directly)
│   │   │   ├── jwt.ts         ← signAccessToken, signRefreshToken, verify helpers
│   │   │   ├── logger.ts      ← Pino instance (import this everywhere instead of console.log)
│   │   │   ├── pagination.ts  ← parsePaginationParams, buildPaginatedResponse
│   │   │   └── prisma.ts      ← singleton PrismaClient; connectDatabase / disconnectDatabase
│   │   └── types/
│   │       └── index.ts   ← Role enum, JwtPayload, AuthenticatedUser, PaginatedResponse;
│   │                          also augments Express.Request with req.user
│   └── tests/
│       ├── users.service.test.ts
│       └── locations.service.test.ts
│
└── client/                ← Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── layout.tsx              ← root layout; mounts QueryProvider + AuthProvider + Toaster
        │   ├── page.tsx                ← redirects to /dashboard or /login based on auth state
        │   ├── globals.css             ← Tailwind directives
        │   ├── login/page.tsx
        │   └── (dashboard)/
        │       ├── layout.tsx          ← sidebar nav + mobile header + auth guard
        │       ├── dashboard/page.tsx
        │       ├── users/page.tsx
        │       └── locations/page.tsx
        ├── components/
        │   ├── ui/         ← Button, Input, Modal, Table, Badge, Spinner, Pagination, SearchBar
        │   ├── users/      ← UserTable, UserForm, UserModal
        │   └── locations/  ← LocationTable, LocationForm, LocationModal
        ├── hooks/
        │   ├── useUsers.ts      ← TanStack Query hooks: useUsers, useUser, useCreateUser,
        │   │                       useUpdateUser, useDeleteUser
        │   └── useLocations.ts  ← same pattern for locations
        ├── lib/
        │   ├── api.ts      ← Axios instance; attaches Bearer token; handles silent refresh on 401
        │   └── utils.ts    ← cn(), formatDate(), getInitials(), truncate()
        ├── providers/
        │   ├── AuthProvider.tsx  ← in-memory token store; session restore on mount via /auth/refresh
        │   └── QueryProvider.tsx ← TanStack QueryClient with default options
        └── types/
            └── index.ts    ← User, Location, Role, PaginatedResponse, ApiResponse, form DTOs
```

---

## Key Architecture Rules

### Server — Clean Architecture per module
Each feature module (`auth`, `users`, `locations`, `stats`) follows this strict layering:

```
Controller  →  validates request (Zod parse), calls service, sends response
Service     →  business logic, enforces RBAC rules, throws AppError subclasses
Repository  →  Prisma calls only, never throws HTTP errors, never imports from other modules
```

- **Never call `res.status()` directly inside a service or repository.** Throw from `utils/errors.ts` and let `errorHandler.ts` handle it.
- **Never import `prisma` outside of repository files.** Always go through the repository layer.
- **Never `console.log`.** Use the Pino logger from `src/utils/logger.ts`.
- All passwords are stripped at the repository layer via Prisma `select` — the `password` field is never returned from any repository function.

### Adding a new server module
1. Create `src/modules/<name>/` with: `<name>.schemas.ts`, `<name>.repository.ts`, `<name>.service.ts`, `<name>.controller.ts`, `<name>.routes.ts`
2. Register the router in `src/app.ts`: `app.use('/api/<name>', <name>Routes)`
3. Write tests in `tests/<name>.service.test.ts` — mock `src/utils/prisma` with `jest.mock`

### Client — Data flow
```
Page  →  hook (TanStack Query)  →  api.ts (Axios)  →  Express API
```

- **Access token lives in memory only** (`src/lib/api.ts` → `_accessToken`). Never use `localStorage` or `sessionStorage` for tokens.
- **Refresh token is an httpOnly cookie** — the browser sends it automatically; never read or write it in JS.
- Token refresh on 401 is handled automatically in the Axios response interceptor in `src/lib/api.ts`. A queue prevents parallel refresh calls.
- All mutations (create/update/delete) call `queryClient.invalidateQueries` on success — do not manually update cache.
- Toast notifications are triggered inside each mutation's `onSuccess`/`onError` — do not add separate `toast()` calls in page components for the same event.

### Adding a new client page
1. Create `src/app/(dashboard)/<name>/page.tsx` — it inherits the auth guard from the route group layout
2. Create hooks in `src/hooks/use<Name>.ts` following the existing pattern
3. If the page needs CRUD components, add to `src/components/<name>/`
4. Add a nav link in `src/app/(dashboard)/layout.tsx` → `navItems` array (include `roles` if restricted)

---

## RBAC

| Action | ADMIN | MANAGER | USER |
|---|---|---|---|
| Create/edit users | ✓ | ✓ | ✗ |
| Assign ADMIN role | ✓ | ✗ | ✗ |
| Delete users | ✓ | ✗ | ✗ |
| Create/edit locations | ✓ | ✓ | ✗ |
| Delete locations | ✓ | ✗ | ✗ |
| View all locations | ✓ | ✓ | ✗ |
| View assigned locations only | ✓ | ✓ | ✓ |

**Important RBAC rules enforced in services:**
- `users.service.ts` — MANAGER cannot create/update a user with `role: ADMIN`, and cannot modify a user who is already an ADMIN
- `locations.service.ts` — USER role receives a `userId` filter so they only see their own assigned locations
- Route-level enforcement via `requireRole()` is a second layer; business logic rules are in the service

---

## Database Schema

**Models:** `User`, `Location`, `UserLocation` (M:M join), `RefreshToken`

```prisma
User         id, name, email (unique), password (hashed), role, isActive, createdAt, updatedAt
Location     id, name, storeNumber, address, city, state, zip, notes?, createdAt, updatedAt
UserLocation userId + locationId (composite PK), assignedAt
RefreshToken id, token (unique), userId, expiresAt, createdAt
```

- All IDs are UUIDs (`@default(uuid())`)
- Cascade deletes: deleting a User removes their UserLocation rows and RefreshTokens; deleting a Location removes its UserLocation rows
- **After any schema change:** run `npm run db:migrate` (creates a migration) then `npm run db:generate` (regenerates the Prisma client)

---

## Environment Variables

### `server/.env`
```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/location_manager
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars — different from access secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=15d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### `client/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Config is validated with Zod at server startup (`server/src/config/index.ts`). The process exits immediately with a clear error if any variable is missing or invalid — check this first when the server fails to start.

---

## Commands

### From the project root
```bash
npm install          # install all workspaces
npm run dev          # start both server (:5000) and client (:3000) concurrently
npm run build        # production build for both
npm run test         # run server Jest tests
```

### Server only (`cd server`)
```bash
npm run dev          # hot reload via ts-node-dev
npm run db:migrate   # create + apply a new Prisma migration (prompts for name)
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:seed      # seed sample data (8 users, 5 locations, with assignments)
npm run db:reset     # drop all tables, re-migrate, re-seed
npm test             # Jest with coverage
npm run build        # compile to dist/
npm run start        # run compiled dist/server.js
```

### Client only (`cd client`)
```bash
npm run dev          # Next.js dev server
npm run build        # production build
npm run start        # serve the production build
```

---

## Seed Data

After `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@example.com | Admin123! |
| MANAGER | manager1@example.com | Manager123! |
| MANAGER | manager2@example.com | Manager123! |
| USER | user1@example.com | User123! |
| USER | user2–5@example.com | User123! |

5 locations across NY, CA, IL, TX, FL. Users are assigned to locations in the seed.

---

## API Response Shape

All endpoints return JSON with a consistent shape:

```ts
// Success (list)
{ success: true, data: T[], total: number, page: number, limit: number, totalPages: number }

// Success (single)
{ success: true, data: T }

// Error (AppError or ZodError)
{ success: false, message: string, errors?: Record<string, string[]> }
```

Pagination query params: `?page=1&limit=20&search=...` — handled by `parsePaginationParams()` in `src/utils/pagination.ts`.

---

## Auth Flow

```
Login  →  POST /api/auth/login
          ← access token in JSON body (store in AuthProvider memory)
          ← refresh token as Set-Cookie: refreshToken (httpOnly)

Request →  Authorization: Bearer <accessToken>

401    →  Axios interceptor calls POST /api/auth/refresh (cookie sent automatically)
          ← new access token in JSON body
          ← new refresh token cookie (old one is deleted from DB — rotation)
          → retry original request with new token

Logout →  POST /api/auth/logout  (clears cookie + deletes DB refresh token)
```

---

## Testing

Tests live in `server/tests/`. They mock Prisma at the module level:

```ts
jest.mock('../src/utils/prisma', () => ({
  prisma: { user: { findMany: jest.fn(), ... } }
}));
```

- Test the **service layer** only — controllers and repositories are not unit tested
- Never hit a real database in unit tests
- Run: `cd server && npm test`
- Coverage report is generated in `server/coverage/`

---

## Error Handling

Use the pre-built error classes from `server/src/utils/errors.ts`. Never use raw `new Error()` in service code:

```ts
throw new NotFoundError('User');       // 404
throw new UnauthorizedError();         // 401
throw new ForbiddenError();            // 403
throw new BadRequestError('message');  // 400
throw new ConflictError('message');    // 409
```

For unexpected server errors, let them bubble up naturally — `errorHandler.ts` catches them, logs them, and returns a generic 500 without leaking stack traces in production.

---

## Code Style

- **Prettier** config: single quotes, semi, 100 char width, trailing commas (es5)
- **No `any`** — use `unknown` and narrow, or define a proper type. `@typescript-eslint/no-explicit-any` is set to `warn`
- **Unused vars** prefixed with `_` are allowed (e.g., `_req`, `_next`)
- TypeScript strict mode is enabled on both client and server
- Client components that use hooks or browser APIs must have `'use client'` at the top
- Server components (no interactivity, no hooks) should NOT have `'use client'`

---

## Common Pitfalls

- **Prisma client not generated** — if you get `Cannot find module '@prisma/client'` after a schema change, run `npm run db:generate` inside `server/`
- **Cookie not sent** — Axios must have `withCredentials: true` (already set in `src/lib/api.ts`). The Express CORS config must have `credentials: true` and a specific origin (not `*`)
- **Adding a nav item** — include the `roles` array on `NavItem` if the page should be hidden from USER role; otherwise it shows for everyone
- **Invalidating queries** — after a mutation, invalidate both the list key and any detail key. Also invalidate `['stats']` when user/location counts change
- **Schema change workflow** — always `db:migrate` (creates SQL) before `db:generate` (updates TS types). Never edit migration files manually.
- **Rate limiter on auth routes** — `authLimiter` is applied directly in `auth.routes.ts` (not in `app.ts`), so it's stricter than the general `apiLimiter`
