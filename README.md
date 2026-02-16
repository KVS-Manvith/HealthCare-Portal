# Healthcare Portal

Production-ready full-stack healthcare portal with JWT + refresh-token auth, role-based authorization, rate limiting, CI, and Docker support.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Spring Boot + Spring Security + JPA + H2/PostgreSQL
- Database migrations: Flyway
- Auth: Access token + refresh token (JWT-based access control)

## Completed Features
- Secure register/login with BCrypt password hashing
- Access tokens + refresh tokens + logout endpoint
- Auto-refresh access token on frontend when a protected request returns `401`
- Role model: `PATIENT`, `ADMIN`
- Authorization rules:
  - Public: doctors/hospitals read
  - Authenticated: user profile + appointments
  - Admin-only: hospital/doctor create/update/delete + appointment status management
- Admin UI route for appointment management: `/admin/appointments`
- Admin UI route for hospital management: `/admin/hospitals`
- Admin UI route for doctor management: `/admin/doctors`
- Admin management screens include search and pagination for faster operations
- Appointment safeguards (invalid user/doctor checks, no past-date bookings)
- Input validation on doctor/hospital CRUD + appointment status values
- Appointment cancellation flow (`DELETE /api/appointments/{id}`) for owner/admin
- Anti-abuse rate limiting on `/api/auth/login` and `/api/auth/register`
- Health endpoint exposed at `/actuator/health`
- Integration tests for auth/authorization behavior
- GitHub Actions CI for frontend + backend
- GitHub Actions image release workflow for GHCR
- GitHub Actions production deploy workflow (manual trigger)
- Dockerfiles for frontend/backend + root `docker-compose.yml`
- Persistent PostgreSQL database in Docker (`postgres` service + volume)
- Versioned SQL schema migrations (`backend/src/main/resources/db/migration`)
- Production stack with HTTPS termination (Caddy) and scheduled Postgres backups

## Demo Users
- Patient:
  - Email: `demo@healthcare.local`
  - Password: `demo123`
- Admin:
  - Email: `admin@healthcare.local`
  - Password: `admin123`

## Local Run

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend URL: `http://localhost:8080`

Default local DB is in-memory H2. To run backend against PostgreSQL locally, set:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect`

Schema setup is migration-driven:
- Flyway runs automatically on startup
- Hibernate schema mode defaults to `validate` (no auto-create/update)

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend URL: `http://localhost:3000`

## Docker Run
```bash
docker compose up --build
```
Frontend URL: `http://localhost:3000`  
Backend URL: `http://localhost:8080`

Set a strong secret in `docker-compose.yml`:
- `JWT_SECRET`

Database env vars (see `.env.example`):
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Production Deploy

This repo includes:
- `docker-compose.prod.yml` for runtime deployment with prebuilt images
- `infra/caddy/Caddyfile` for HTTPS + reverse proxy
- `.github/workflows/release-images.yml` to publish backend/frontend images to GHCR
- `.github/workflows/deploy-production.yml` to deploy to a server over SSH

### 1. Publish images
Push to `main`/`master` or create a `v*` tag. The workflow publishes:
- `ghcr.io/<owner>/<repo>-backend:<tag>`
- `ghcr.io/<owner>/<repo>-frontend:<tag>`

### 2. Prepare production env
```bash
cp .env.production.example .env.production
```
Set:
- `JWT_SECRET` (required)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `GHCR_REPOSITORY` in `owner/repo` format
- `IMAGE_TAG` (for example `latest` or `v1.0.0`)
- `PUBLIC_DOMAIN` and `LETSENCRYPT_EMAIL`
- backup retention/schedule vars (optional)

Optional generator script:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/prepare-production-env.ps1 `
  -GhcrRepository "owner/repo" `
  -PublicDomain "healthcare.example.com" `
  -LetsencryptEmail "ops@example.com"
```

### 3. Deploy
Optional preflight:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/preflight-production.ps1 -EnvFile .env.production
```

Deploy:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

In production compose:
- Public exposure is only through Caddy (`80/443`)
- Frontend, backend, and database are internal-only services
- Postgres backups are written to the `postgres_backups` volume on schedule

### 4. Optional: GitHub Actions one-click deploy
Set repository secrets:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY` (private key with access to target host)

Then run `.github/workflows/deploy-production.yml` and choose an `image_tag`.

## API Summary

### Public
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/doctors`
- `GET /api/hospitals`

### Authenticated
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/user/{userId}`
- `DELETE /api/appointments/{appointmentId}` (owner or admin)

### Admin
- `POST /api/hospitals`
- `POST /api/doctors`
- `PUT /api/hospitals/{id}`
- `PUT /api/doctors/{id}`
- `DELETE /api/hospitals/{id}`
- `DELETE /api/doctors/{id}`
- `PUT /api/appointments/{appointmentId}/status`

## Validation Commands
- Frontend tests: `cd frontend && npm run test`
- Frontend typecheck: `npm run typecheck`
- Frontend build: `npm run build`
- Frontend audit: `npm audit`
- Backend tests: `./mvnw test`
