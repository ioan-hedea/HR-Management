# HR Management

HR Management is a microservices-based backend with a React frontend portal for core HR workflows.

## Features

- Authentication with JWT-based login and registration.
- Employee profile and account administration.
- Contract lifecycle management (create, update, terminate, lookup).
- Leave/request management (submit, approve, reject, track status).
- Notification delivery service for HR workflow events.
- API Gateway routing and centralized entrypoint.
- Eureka service discovery across all backend services.

## Architecture

```text
Frontend (React, Vite)
        |
        v
  API Gateway (8080)
        |
        +--> Authentication Service (8081)
        +--> User Service (8082)
        +--> Contract Service (8083)
        +--> Request Service (8084)
        +--> Notification Service (8085)

Gateway + all backend services <--> Eureka Registry (8761)
Authentication/User/Contract/Request/Notification <--> PostgreSQL (5432)
```

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

## Repository Structure Notes

- `example-microservice/` was removed because it is not part of the production stack.
- Root `probe` file was removed as unused legacy scaffolding.
- `contract/`, `request/`, `notification/`, and `user/` are grouped domains, each containing:
  - `microservice/` (runtime app)
  - `client/` (inter-service client contracts)
  - `commons/` (shared DTOs/value objects)

## Prerequisites

- Java 21+
- Docker + Docker Compose
- Node.js 20+

## Quick Start (Local Processes + Postgres Container)

1. Create local environment values:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with real secrets.
3. Start Postgres + backend services:

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

## Full Docker Compose (All Backend Services)

Use the full stack compose file to run Postgres, Eureka, gateway, and all backend services in Docker:

```bash
docker compose --env-file .env.local -f docker-compose.full.yml up --build -d
```

Stop full stack:

```bash
docker compose --env-file .env.local -f docker-compose.full.yml down
```

## OpenAPI / Swagger

Included endpoints:

- Gateway Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- Gateway OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Auth Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- Auth OpenAPI JSON: `http://localhost:8081/v3/api-docs`

Notes:

- Contract and Notification services already expose springdoc endpoints in their current setup.
- User and Request services do not include OpenAPI configuration yet.

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

The Postgres compose setup auto-creates:

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

- Java version errors: use Java 21 or newer and rerun.
- Backend start failures: inspect `.run/*.log`.
- Authentication login issues: confirm `ADMIN` exists in `hr_auth.users` and secrets are loaded.
