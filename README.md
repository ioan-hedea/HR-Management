# HR Management

HR Management is a microservices-based backend with a React frontend portal.

## Services and Ports

| Port | Service |
|------|---------|
| 8080 | API Gateway |
| 8081 | Authentication service |
| 8082 | User service |
| 8083 | Contract service |
| 8084 | Request service |
| 8085 | Notification service |
| 8761 | Eureka service registry |
| 5432 | PostgreSQL |
| 5173 | Frontend (Vite dev server) |

## Prerequisites

- Java 11 or 17 (Gradle 7.4 is not compatible with Java 22+)
- Docker + Docker Compose
- Node.js 20+

## Quick Start (Recommended)

1. Create local environment values:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with real secrets.
3. Start Postgres + backend:

```bash
./scripts/backend-postgres-up.sh
```

4. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Open `http://localhost:5173`.

Stop backend and Postgres:

```bash
./scripts/backend-postgres-down.sh
```

## Local Environment Variables

`./scripts/backend-postgres-up.sh` loads `.env.local` (or `.env`) and exits early if required values are missing.

Core variables:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_NET_ID`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `AUTH_DB_URL`, `AUTH_DB_USERNAME`, `AUTH_DB_PASSWORD`
- `USER_DB_URL`, `USER_DB_USERNAME`, `USER_DB_PASSWORD`
- `CONTRACT_DB_URL`, `CONTRACT_DB_USERNAME`, `CONTRACT_DB_PASSWORD`
- `REQUEST_DB_URL`, `REQUEST_DB_USERNAME`, `REQUEST_DB_PASSWORD`
- `NOTIFICATION_DB_URL`, `NOTIFICATION_DB_USERNAME`, `NOTIFICATION_DB_PASSWORD`
- `MAIL_USERNAME`, `MAIL_PASSWORD`

See `.env.example` for the full template.

## PostgreSQL Setup

The compose file starts one Postgres container and auto-creates:

- `hr_auth`
- `hr_user`
- `hr_contract`
- `hr_request`
- `hr_notification`

Manual start command:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

## Frontend Routing

Frontend is in `frontend/` and uses Vite proxy routing:

- `/api/auth/*` -> `http://localhost:8081/*`
- `/api/user/*` -> `http://localhost:8082/*`
- `/api/contract/*` -> `http://localhost:8083/*`
- `/api/request/*` -> `http://localhost:8084/*`
- `/api/notification/*` -> `http://localhost:8085/*`
- `/api/gateway/*` -> `http://localhost:8080/*`

To customize targets, copy `frontend/.env.example` to `frontend/.env.local`.

## Default Admin Bootstrap

Authentication and User services can bootstrap an admin account on startup.

- NetID defaults to `ADMIN` (override via `BOOTSTRAP_ADMIN_NET_ID`)
- Password is always read from `BOOTSTRAP_ADMIN_PASSWORD`
- Disable bootstrap after first run with `BOOTSTRAP_ADMIN_ENABLED=false`

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

- Backend: Gradle assemble + check
- Frontend: npm install + build
- Artifacts: reports and frontend dist uploads

### Required GitHub Secrets

Set these at `Settings -> Secrets and variables -> Actions`:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `AUTH_DB_PASSWORD`
- `USER_DB_PASSWORD`
- `CONTRACT_DB_PASSWORD`
- `REQUEST_DB_PASSWORD`
- `NOTIFICATION_DB_PASSWORD`

Codespaces can use the same names for parity with CI.

## Troubleshooting

- Java error about version: switch to Java 17 (or 11), then retry.
- Backend start failures: inspect `.run/*.log`.
- Authentication login issues: confirm `ADMIN` exists in `hr_auth.users` and secrets are loaded.
