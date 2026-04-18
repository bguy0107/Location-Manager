# Location Manager

A production-ready, mobile-first web application for managing physical store locations and team members with role-based access control.

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

---

## Local Development

### Prerequisites

- Node.js 22 LTS
- PostgreSQL 14+
- npm 10+

### 1. Clone and install

```bash
git clone <repo-url> location-manager
cd location-manager
npm install
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/location_manager
JWT_ACCESS_SECRET=<at least 32 random characters>
JWT_REFRESH_SECRET=<at least 32 random characters — different from access secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=15d
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Configure the client

```bash
cp client/.env.local.example client/.env.local
```

`client/.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 4. Create the database

```bash
psql -U postgres -c "CREATE DATABASE location_manager;"
```

### 5. Run migrations and seed

```bash
cd server
npm run db:migrate
npm run db:seed
cd ..
```

### 6. Start the app

```bash
npm run dev
```

- **Backend:** http://localhost:5001
- **Frontend:** http://localhost:3000

### Seed accounts

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@example.com | Admin123! |
| MANAGER | manager1@example.com | Manager123! |
| MANAGER | manager2@example.com | Manager123! |
| USER | user1@example.com | User123! |

---

## Production Deployment — Ubuntu Server 24.04

This guide deploys the app behind nginx with two systemd services (one for the API, one for the frontend). All services run as a dedicated low-privilege system user. The app is accessible on port 80.

### 1. System preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw
```

### 2. Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v22.x.x
npm -v    # should print 10.x.x
```

### 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Verify it is running:

```bash
sudo systemctl status postgresql
```

### 4. Create a dedicated PostgreSQL user and database

Switch to the `postgres` system account:

```bash
sudo -i -u postgres
```

Open the PostgreSQL prompt:

```bash
psql
```

Run the following SQL — replace `your_db_password` with a strong password and note it for the `DATABASE_URL` environment variable:

```sql
CREATE USER locmgr WITH PASSWORD 'your_db_password';
CREATE DATABASE location_manager OWNER locmgr;
GRANT ALL PRIVILEGES ON DATABASE location_manager TO locmgr;
\q
```

Exit back to your sudo user:

```bash
exit
```

Verify the connection works:

```bash
psql -U locmgr -h 127.0.0.1 -d location_manager -c "\conninfo"
```

### 5. Create a dedicated app system user

This user owns all app files and runs both services. It has no login shell and no sudo access.

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin locmgr
```

### 6. Transfer the project to the server

**Option A — from your local machine using scp:**

```bash
# Run this on your Mac, not the server
scp -r /path/to/location-manager your_user@<SERVER_IP>:/tmp/location-manager
```

Then on the server, move it into place:

```bash
sudo mv /tmp/location-manager /opt/location-manager
```

**Option B — clone from a git repository (if you have one):**

```bash
sudo git clone <repo-url> /opt/location-manager
```

Set ownership so the `locmgr` user can read and write the app directory:

```bash
sudo chown -R locmgr:locmgr /opt/location-manager
```

### 7. Configure environment variables

**Server `.env`:**

```bash
sudo -u locmgr cp /opt/location-manager/server/.env.example /opt/location-manager/server/.env
sudo -u locmgr nano /opt/location-manager/server/.env
```

Set the following values:

```env
DATABASE_URL=postgresql://locmgr:your_db_password@127.0.0.1:5432/location_manager
JWT_ACCESS_SECRET=<generate with: openssl rand -base64 48>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 48>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=15d
PORT=5001
NODE_ENV=production
CORS_ORIGIN=http://<SERVER_IP>
```

Generate secure secrets:

```bash
openssl rand -base64 48   # run twice — once for each secret
```

**Client `.env.local`:**

```bash
sudo -u locmgr cp /opt/location-manager/client/.env.local.example /opt/location-manager/client/.env.local
sudo -u locmgr nano /opt/location-manager/client/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://<SERVER_IP>/api
```

> `NEXT_PUBLIC_API_URL` is baked into the client bundle at build time. It must be set to the correct value **before** running `npm run build`.

### 8. Install dependencies

```bash
cd /opt/location-manager
sudo -u locmgr npm install
```

### 9. Build both apps

```bash
sudo -u locmgr npm run build
```

This compiles the Express server to `server/dist/` and builds the Next.js client to `client/.next/`.

After building, copy the Next.js static assets into the standalone output directory:

```bash
sudo -u locmgr cp -r /opt/location-manager/client/.next/static \
    /opt/location-manager/client/.next/standalone/.next/static

# Copy the public folder if it exists
[ -d /opt/location-manager/client/public ] && \
    sudo -u locmgr cp -r /opt/location-manager/client/public \
    /opt/location-manager/client/.next/standalone/public
```

### 10. Run database migrations

```bash
cd /opt/location-manager/server
sudo -u locmgr npx prisma migrate deploy
```

`migrate deploy` applies all pending migrations without prompting — correct for production. Do not use `db:migrate` (which is the dev command that prompts for a migration name).

### 11. Create systemd services

**API server — `/etc/systemd/system/location-manager-server.service`:**

```bash
sudo nano /etc/systemd/system/location-manager-server.service
```

```ini
[Unit]
Description=Location Manager API Server
After=network.target postgresql.service

[Service]
Type=simple
User=locmgr
Group=locmgr
WorkingDirectory=/opt/location-manager/server
EnvironmentFile=/opt/location-manager/server/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Web client — `/etc/systemd/system/location-manager-client.service`:**

```bash
sudo nano /etc/systemd/system/location-manager-client.service
```

```ini
[Unit]
Description=Location Manager Web Client
After=network.target location-manager-server.service

[Service]
Type=simple
User=locmgr
Group=locmgr
WorkingDirectory=/opt/location-manager/client
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Reload systemd and enable both services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable location-manager-server location-manager-client
sudo systemctl start location-manager-server location-manager-client
```

Verify both are running:

```bash
sudo systemctl status location-manager-server
sudo systemctl status location-manager-client
```

### 12. Configure nginx

Create the site configuration:

```bash
sudo nano /etc/nginx/sites-available/location-manager
```

```nginx
server {
    listen 80;
    server_name <SERVER_IP>;

    # Proxy API requests to the Express backend
    location /api {
        proxy_pass         http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Proxy all other requests to the Next.js frontend
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and test the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/location-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable --now nginx
```

### 13. Configure the firewall

Allow SSH, HTTP, and block direct access to the app ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx HTTP'
sudo ufw deny 5001/tcp
sudo ufw deny 3000/tcp
sudo ufw enable
```

Verify the rules:

```bash
sudo ufw status
```

Expected output:

```
Status: active
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx HTTP                 ALLOW       Anywhere
5001/tcp                   DENY        Anywhere
3000/tcp                   DENY        Anywhere
```

### 14. (Optional) Seed the database

Only run this on a fresh installation to create the initial admin account and sample data:

```bash
cd /opt/location-manager/server
sudo -u locmgr npx ts-node prisma/seed.ts
```

Or if the server is already built:

```bash
sudo -u locmgr node -e "require('./dist/server.js')" 2>/dev/null; \
    cd /opt/location-manager/server && \
    sudo -u locmgr npm run db:seed
```

### 15. Verify the deployment

Check the health endpoint:

```bash
curl http://<SERVER_IP>/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

Open `http://<SERVER_IP>` in a browser and log in with:

- **Email:** admin@example.com
- **Password:** Admin123!

Change the admin password immediately after first login.

---

## Managing the App in Production

### View logs

```bash
# API server logs
sudo journalctl -u location-manager-server -f

# Web client logs
sudo journalctl -u location-manager-client -f
```

### Restart services

```bash
sudo systemctl restart location-manager-server
sudo systemctl restart location-manager-client
```

### Deploy an update

```bash
cd /opt/location-manager

# Pull latest code (if using git)
sudo -u locmgr git pull

# Install any new dependencies
sudo -u locmgr npm install

# Rebuild
sudo -u locmgr npm run build

# Copy updated static assets
sudo -u locmgr cp -r client/.next/static client/.next/standalone/.next/static

# Apply any new migrations
cd server && sudo -u locmgr npx prisma migrate deploy && cd ..

# Restart
sudo systemctl restart location-manager-server location-manager-client
```

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
| `npm run db:migrate` | Create and apply a new migration (dev only) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:seed` | Seed sample data |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed |
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
    │   ├── middleware/# Auth, RBAC, error handler, rate limiter
    │   ├── modules/  # Feature modules (auth, users, locations, surveillance)
    │   └── utils/    # Logger, JWT, errors, pagination
    └── tests/        # Jest unit tests
```

---

## API Endpoints

### Auth
```
POST /api/auth/login     — Log in (returns access token + sets refresh cookie)
POST /api/auth/refresh   — Refresh access token using cookie
POST /api/auth/logout    — Log out (clears cookie)
```

### Users
```
GET    /api/users        — List users (ADMIN, MANAGER)
POST   /api/users        — Create user (ADMIN, MANAGER)
GET    /api/users/me     — Get own profile (any authenticated user)
GET    /api/users/:id    — Get user by ID (ADMIN, MANAGER)
PUT    /api/users/:id    — Update user (ADMIN, MANAGER)
DELETE /api/users/:id    — Delete user (ADMIN only)
```

### Locations
```
GET    /api/locations          — List locations (USER sees own only; ADMIN/MANAGER see all)
GET    /api/locations/:id      — Get location by ID
POST   /api/locations          — Create location (ADMIN only)
PUT    /api/locations/:id      — Update location details (ADMIN only)
PATCH  /api/locations/:id/assignments — Update user assignments (ADMIN; MANAGER for assigned locations)
DELETE /api/locations/:id      — Delete location (ADMIN only)
```

### Surveillance
```
GET    /api/surveillance       — List requests (USER sees own locations only)
GET    /api/surveillance/:id   — Get request by ID
POST   /api/surveillance       — Create request (any authenticated user, must be assigned)
PATCH  /api/surveillance/:id   — Update status (ADMIN, MANAGER)
DELETE /api/surveillance/:id   — Delete request (ADMIN only)
```

### Stats
```
GET /api/stats           — Dashboard statistics (ADMIN, MANAGER)
```

---

## RBAC

| Permission | ADMIN | MANAGER | USER |
|---|---|---|---|
| Create/edit users | ✓ | ✓ | ✗ |
| Delete users | ✓ | ✗ | ✗ |
| Assign ADMIN role | ✓ | ✗ | ✗ |
| Create/edit location details | ✓ | ✗ | ✗ |
| Manage location user assignments | ✓ | ✓ (assigned only) | ✗ |
| Delete locations | ✓ | ✗ | ✗ |
| View all locations | ✓ | ✓ | ✗ |
| View own assigned locations | ✓ | ✓ | ✓ |
| Create surveillance requests | ✓ | ✓ | ✓ (assigned locations) |
| Update surveillance status | ✓ | ✓ | ✗ |
| Delete surveillance requests | ✓ | ✗ | ✗ |

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- Constant-time login response prevents user enumeration via timing
- JWT access tokens expire in 15 minutes (stored in memory only, never localStorage)
- Refresh tokens stored in DB with expiry matching JWT, rotated atomically on each use
- Refresh token delivered as httpOnly + SameSite=Strict cookie
- Helmet.js security headers on all responses
- CORS restricted to configured origin
- Rate limiting: auth endpoints (10 req/15 min), API (100 req/15 min)
- Rate limiter reads real client IP via `trust proxy` (correct behind nginx)
- All inputs validated with Zod on the server
