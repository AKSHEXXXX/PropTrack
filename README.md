# PropTrack CRM — Real Estate Backend

> A production-ready **NestJS + TypeORM + PostgreSQL** backend for managing a real estate agency's full CRM pipeline — from property listings and leads to deals, contracts, and payments.

[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs)](https://nestjs.com)
[![TypeORM](https://img.shields.io/badge/TypeORM-v0.3-FE0902)](https://typeorm.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-336791?logo=postgresql)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [Advanced SQL](#advanced-sql)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)

---

## Features

| Category | Details |
|---|---|
| **Authentication** | JWT-based (bcrypt hashed, 7-day expiry, role-based: admin / manager / agent) |
| **10 Feature Modules** | agencies, agents, clients, properties, leads, appointments, deals, contracts, payments, tags |
| **Dashboard** | 7 analytical endpoints using nested & correlated SQL queries |
| **Advanced SQL** | 3 PL/pgSQL triggers, 2 stored procedures, 2 functions |
| **Query Complexity** | 3 nested subqueries (NQ-01..03), 2 correlated subqueries (CQ-01..02) |
| **Seed Data** | 1 agency, 3 agents, 10 clients, 15 properties, 20 leads, 5 tags |
| **Swagger Docs** | Full OpenAPI documentation at `/api/docs` |
| **Docker** | Full `docker-compose` setup (Postgres 16 + NestJS app) |

---

## Architecture

```
PropTrack/
└── backend/
    ├── src/
    │   ├── main.ts                    # Bootstrap (Swagger, ValidationPipe, Filters)
    │   ├── app.module.ts              # Root module (TypeORM, ConfigModule)
    │   ├── auth/                      # JWT auth (register, login, guard, strategy)
    │   ├── common/
    │   │   ├── decorators/            # @CurrentUser()
    │   │   ├── dto/                   # PaginationDto
    │   │   ├── filters/               # AllExceptionsFilter
    │   │   └── interceptors/          # ResponseInterceptor (envelope)
    │   ├── database/
    │   │   ├── seeds/seed.ts          # DB seed script
    │   │   └── sql/
    │   │       ├── schema.sql         # Full DB schema (14 tables, 11 ENUMs)
    │   │       └── advanced.sql       # Functions, triggers, stored procedures
    │   └── modules/
    │       ├── agencies/
    │       ├── agents/
    │       ├── appointments/
    │       ├── clients/
    │       ├── contracts/
    │       ├── dashboard/
    │       ├── deals/
    │       ├── leads/
    │       ├── payments/
    │       ├── properties/
    │       └── tags/
    ├── test/
    │   ├── app.e2e-spec.ts
    │   └── qualification.e2e-spec.ts  # Full qualification test suite
    ├── docker-compose.yml
    ├── Dockerfile
    └── .env.example
```

---

## Modules

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user (email, password, role) |
| POST | `/api/auth/login` | Login, receive JWT access token |

### Agencies
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agencies` | Create agency |
| GET | `/api/agencies?page=1&limit=20` | List agencies (paginated) |
| GET | `/api/agencies/:id` | Get agency with agents |
| PATCH | `/api/agencies/:id` | Update agency |
| DELETE | `/api/agencies/:id` | Delete agency |

### Agents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agents` | Create agent |
| GET | `/api/agents` | List active agents |
| GET | `/api/agents/:id` | Agent detail |
| GET | `/api/agents/:id/leads` | Agent's leads |
| GET | `/api/agents/:id/deals` | Agent's deals |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Soft-deactivate agent |

### Properties
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/properties` | Create property listing |
| GET | `/api/properties?city=Dubai&minPrice=1000000&propertyType=apartment` | Filter & paginate |
| GET | `/api/properties/:id` | Property with images & agent |
| PATCH | `/api/properties/:id` | Update listing |
| DELETE | `/api/properties/:id` | Delete (blocked if active leads) |
| POST | `/api/properties/:id/images` | Add image |
| DELETE | `/api/properties/:id/images/:imageId` | Remove image |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/leads` | Create lead |
| GET | `/api/leads?status=new&agentId=1` | Filter leads |
| GET | `/api/leads/pipeline` | Pipeline breakdown by status |
| GET | `/api/leads/:id` | Lead with full details |
| PATCH | `/api/leads/:id` | Update status/notes |
| DELETE | `/api/leads/:id` | Delete lead |
| POST | `/api/leads/:id/tags/:tagId` | Tag a lead |
| DELETE | `/api/leads/:id/tags/:tagId` | Untag a lead |
| POST | `/api/leads/:id/assign?agencyId=1` | Auto-assign lead (stored procedure) |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | Schedule appointment |
| GET | `/api/appointments?agentId=1&status=scheduled` | Filter appointments |
| GET | `/api/appointments/upcoming` | Upcoming appointments |
| GET | `/api/appointments/:id` | Appointment detail |
| PATCH | `/api/appointments/:id` | Update status |
| DELETE | `/api/appointments/:id` | Cancel |

### Deals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/deals` | Create deal (commission auto-calculated via SQL function) |
| GET | `/api/deals` | List deals |
| GET | `/api/deals/:id` | Deal with contracts & payments |
| GET | `/api/deals/:id/audit` | Deal audit log (trigger-populated) |
| PATCH | `/api/deals/:id` | Update (closing triggers property→sold via DB trigger) |
| DELETE | `/api/deals/:id` | Cancel deal |

### Contracts, Payments, Tags
Standard CRUD — see Swagger docs for full reference.

### Dashboard
| Endpoint | Query Type | Description |
|---|---|---|
| `GET /api/dashboard/summary` | Aggregation | KPI counts (properties, leads, deals, agents) |
| `GET /api/dashboard/pipeline` | Aggregation | Lead pipeline by status |
| `GET /api/dashboard/agent-performance` | **NQ-01** (nested) | Agents with no closed deals this month |
| `GET /api/dashboard/unsold-viewed` | **CQ-01** (correlated) | Properties visited but never offered on |
| `GET /api/dashboard/stale-leads` | **CQ-02** (correlated) | Stale leads with agent context |
| `GET /api/dashboard/top-agents` | **NQ-02** (nested) | Top 5 agents by deal value this month |
| `GET /api/dashboard/above-average` | **NQ-03** (nested) | Properties priced above agency average |
| `GET /api/dashboard/monthly-report?agencyId=1&month=8&year=2025` | Stored Proc | Full monthly report (calls `sp_generate_monthly_report`) |

---

## Database Schema

14 tables, 11 custom ENUMs:

```
agencies → agents → properties
                 → leads → appointments
                         → deals → contracts
                                 → payments
clients  → leads
tags     ←→ lead_tags ←→ leads
users (auth)
deal_audit_log (populated by trigger)
```

---

## Advanced SQL

### Functions
| Function | Purpose |
|---|---|
| `fn_calculate_commission(deal_id)` | Calculates agent commission from deal price × commission rate |
| `fn_get_agent_conversion_rate(agent_id)` | Returns lead-to-deal conversion % for an agent |

### Triggers
| Trigger | On | Purpose |
|---|---|---|
| `trg_close_deal_update_property` | `deals` AFTER UPDATE | Marks property as `sold` when deal closes |
| `trg_flag_stale_leads` | `leads` BEFORE UPDATE | Sets `is_stale = TRUE` if no activity for 7+ days |
| `trg_audit_log_deals` | `deals` AFTER INSERT/UPDATE | Logs status changes to `deal_audit_log` |

### Stored Procedures
| Procedure | Purpose |
|---|---|
| `sp_auto_assign_lead(lead_id, agency_id)` | Assigns lead to agent with fewest active leads in the agency |
| `sp_generate_monthly_report(agency_id, month, year)` | Prints monthly performance report per agent |

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone
git clone https://github.com/AKSHEXXXX/PropTrack.git
cd PropTrack/backend

# 2. Copy env
cp .env.example .env

# 3. Start DB + App
docker-compose up -d

# 4. Seed data
docker exec -it proptrack_backend pnpm seed
```

### Option 2: Local Development

```bash
# 1. Prerequisites: Node 20+, pnpm, PostgreSQL 16

# 2. Install dependencies
cd PropTrack/backend
pnpm install

# 3. Copy and configure .env
cp .env.example .env
# Edit .env with your DB credentials

# 4. Start PostgreSQL (or use docker for just the DB)
docker-compose up -d db

# 5. Start the app (auto-syncs schema)
pnpm start:dev

# 6. Seed data
pnpm seed
```

Then open:
- **API**: http://localhost:3000/api/v1
- **Swagger**: http://localhost:3000/api/docs

**Admin credentials**: `admin@proptrack.com` / `Admin1234!`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `proptrack` | DB user |
| `DB_PASSWORD` | `proptrack_secret` | DB password |
| `DB_DATABASE` | `proptrack_db` | DB name |
| `JWT_SECRET` | — | **Required** — JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |

---

## Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# E2E / Qualification tests (requires running DB)
pnpm test:e2e
```

---

## API Response Envelope

All responses are wrapped in a consistent envelope:

```json
{
  "statusCode": 200,
  "message": "Agencies fetched successfully",
  "data": { ... }
}
```

Errors follow the same structure:

```json
{
  "statusCode": 404,
  "message": "Agency #99 not found",
  "error": "NOT_FOUND",
  "path": "/api/agencies/99",
  "timestamp": "2025-08-14T10:00:00.000Z"
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS v11 |
| Language | TypeScript v5.7 |
| ORM | TypeORM v0.3 |
| Database | PostgreSQL v16 |
| Auth | Passport.js + JWT |
| Validation | class-validator + class-transformer |
| Docs | @nestjs/swagger (OpenAPI 3) |
| Testing | Jest + Supertest |
| Package Manager | pnpm |
| Container | Docker + Docker Compose |
