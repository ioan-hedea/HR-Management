# HR Management

## Port map

| Port | Service                   |
|------|---------------------------|
| 8080 | API gateway               |
| 8081 | Authentication            |
| 8082 | User                      |
| 8083 | Contract                  |
| 8084 | Request                   |
| 8085 | Notification              |
| 8761 | Service registry (Eureka) |


## React frontend

A React frontend starter was added at `frontend/`.

### 1) Start PostgreSQL (recommended)

```bash
docker compose -f docker-compose.postgres.yml up -d
```

This starts one Postgres instance on `localhost:5432` with separate databases:
- `hr_auth`
- `hr_user`
- `hr_contract`
- `hr_request`
- `hr_notification`

Default credentials:
- user: `hr`
- password: `hr`

### 2) Start backend microservices (Postgres profile)

One-command startup (recommended):

```bash
./scripts/backend-postgres-up.sh
```

The script now waits for each service port to be ready and prints a log tail if any service crashes.
Runtime logs are stored in `.run/*.log`.
It also checks the local Java runtime (use Java 11 or 17 with this Gradle setup).

One-command shutdown:

```bash
./scripts/backend-postgres-down.sh
```

Manual startup is also available:

Run the services you need (at minimum `authentication-microservice`, `user/microservice`, `contract/microservice`, and `request/microservice`):

```bash
SPRING_PROFILES_ACTIVE=postgres ./gradlew :authentication-microservice:bootRun
SPRING_PROFILES_ACTIVE=postgres ./gradlew :user:microservice:bootRun
SPRING_PROFILES_ACTIVE=postgres ./gradlew :contract:microservice:bootRun
SPRING_PROFILES_ACTIVE=postgres ./gradlew :request:microservice:bootRun
SPRING_PROFILES_ACTIVE=postgres ./gradlew :notification:microservice:bootRun
```

If you need to override DB connection details, use service-specific env vars:
- auth: `AUTH_DB_URL`, `AUTH_DB_USERNAME`, `AUTH_DB_PASSWORD`
- user: `USER_DB_URL`, `USER_DB_USERNAME`, `USER_DB_PASSWORD`
- contract: `CONTRACT_DB_URL`, `CONTRACT_DB_USERNAME`, `CONTRACT_DB_PASSWORD`
- request: `REQUEST_DB_URL`, `REQUEST_DB_USERNAME`, `REQUEST_DB_PASSWORD`
- notification: `NOTIFICATION_DB_URL`, `NOTIFICATION_DB_USERNAME`, `NOTIFICATION_DB_PASSWORD`

By default, authentication and user services bootstrap an `ADMIN` account. Override it with:
- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_NET_ID`
- `BOOTSTRAP_ADMIN_PASSWORD`

### 3) Start frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 4) Backend connection model

The frontend calls local proxy paths and Vite forwards them to microservices:

- `/api/auth/*` -> `http://localhost:8081/*`
- `/api/user/*` -> `http://localhost:8082/*`
- `/api/contract/*` -> `http://localhost:8083/*`
- `/api/request/*` -> `http://localhost:8084/*`
- `/api/notification/*` -> `http://localhost:8085/*`
- `/api/gateway/*` -> `http://localhost:8080/*`

Override targets by copying `frontend/.env.example` to `frontend/.env.local` and changing values.

### 5) Quick test flow

1. Open `http://localhost:5173`.
2. Register a regular user, or login with the bootstrap admin account (`ADMIN` + `BOOTSTRAP_ADMIN_PASSWORD`).
3. Login to store the JWT.
4. Use quick checks (`Contract hello`, `Request hello`) or the request workbench to call endpoints.

## CI

GitHub Actions pipeline is configured in `.github/workflows/ci.yml` and runs on push/pull request:

- Backend: Java 11 + Gradle 7.4, `clean assemble`, then `check` (tests + static checks).
- Frontend: Node 20, `npm install`, then `npm run build`.

Build/test reports are uploaded as workflow artifacts.
