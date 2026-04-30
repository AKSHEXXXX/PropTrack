# CLAUDE.md — PropTrack CRM

> This file gives any AI assistant full context about this project.
> Read this entire file before doing anything. Never skip sections.

---

## What This Project Is

PropTrack CRM is a web-based Customer Relationship Management system for small real estate agencies. It manages properties, agents, clients, leads, deals, contracts, and payments in one unified platform.

This is a university Database Management Systems assignment (BITS Pilani Dubai Campus) that also serves as a production-ready portfolio project.

---

## Team

| Name | Role | Responsibility |
|---|---|---|
| Akshat | Tech Lead + Backend | NestJS API, SQL, TypeORM, integration |
| Anirudh | Database | Schema, normalization, seed data, basic queries |
| Vritti | Frontend | React + TypeScript + Tailwind UI |
| Lavanya | Docs + Design | ERD diagram, report, presentation |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | NestJS | v10 |
| Language | TypeScript | v5 |
| ORM | TypeORM | v0.3 |
| Database | PostgreSQL | v16 |
| Auth | JWT + Passport | latest |
| Validation | class-validator + class-transformer | latest |
| Testing | Jest + Supertest | latest |
| API docs | Swagger (OpenAPI) | latest |
| Frontend | React + TypeScript + Tailwind CSS | latest |
| Containerization | Docker + Docker Compose | latest |
| Package manager | pnpm | latest |

---

## Project Structure

```
proptrack-crm/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── agencies/
│   │   │   ├── agents/
│   │   │   ├── clients/
│   │   │   ├── properties/
│   │   │   ├── leads/
│   │   │   ├── appointments/
│   │   │   ├── deals/
│   │   │   ├── contracts/
│   │   │   ├── payments/
│   │   │   └── tags/
│   │   ├── auth/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── config/
│   │   └── main.ts
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── qualification/
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── shared/
│   └── types/
│       └── index.ts
└── .gitignore
```

---

## Database Schema (13 Tables)

```
agencies → agents → properties
clients → leads → appointments → deals → contracts
                                       → payments
leads ↔ tags (via lead_tags junction)
properties → property_images
```

### Enums

```typescript
PropertyType:    'apartment' | 'villa' | 'townhouse' | 'office' | 'retail' | 'land'
PropertyStatus:  'available' | 'under_negotiation' | 'sold' | 'rented' | 'off_market'
ClientType:      'buyer' | 'seller' | 'renter' | 'landlord'
LeadStatus:      'new' | 'contacted' | 'visit_scheduled' | 'offer_made' | 'deal_closed' | 'lost'
AppointmentType: 'site_visit' | 'meeting' | 'call'
AppointmentStatus: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
DealStatus:      'pending' | 'active' | 'closed' | 'cancelled'
ContractType:    'sale' | 'rental' | 'mou' | 'listing_agreement'
ContractStatus:  'draft' | 'sent' | 'signed' | 'expired' | 'cancelled'
PaymentType:     'full' | 'installment' | 'deposit' | 'commission'
PaymentStatus:   'pending' | 'completed' | 'failed' | 'refunded'
```

---

## Key Business Rules (Enforce These Always)

1. A property can only be in ONE active deal at a time
2. When a deal status → `closed`, the linked property status → `sold` automatically (trigger)
3. When a lead has no activity for 7+ days, it is flagged as stale (trigger)
4. Agent commission = `deal.final_price * agent.commission_rate` (function)
5. New leads are auto-assigned to the agent with fewest active leads (stored procedure)
6. A client cannot have two active leads on the same property simultaneously
7. Only agents belonging to the same agency can be assigned to that agency's properties

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=proptrack
DB_PASSWORD=proptrack_secret
DB_DATABASE=proptrack_db

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## API Base URL

```
Development:  http://localhost:3000/api/v1
Swagger docs: http://localhost:3000/api/docs
```

---

## Coding Conventions

- Use `async/await` everywhere, never `.then()` chains
- All DTOs must use `class-validator` decorators
- All entities must use TypeORM decorators
- All controllers must have Swagger `@ApiTags` and `@ApiOperation` decorators
- All endpoints must be protected with `JwtAuthGuard` except `/auth/login` and `/auth/register`
- Return consistent response shape: `{ data, message, statusCode }`
- Use `HttpException` for all errors with descriptive messages
- Never return raw database errors to the client
- All dates stored as UTC in PostgreSQL
- Use `snake_case` for database columns, `camelCase` for TypeScript

---

## What NOT to Do

- Never use `any` TypeScript type
- Never skip DTO validation
- Never expose passwords or JWT secrets in responses
- Never write raw SQL in controllers or services (use QueryBuilder or TypeORM methods, except for the dedicated SQL file which contains stored procedures and triggers)
- Never hardcode environment variables in source files
- Never commit `.env` files

---

## Assignment-Specific SQL Requirements

The following must exist in `database/sql/advanced.sql`:

- [ ] 3 Triggers
- [ ] 2 Stored Procedures
- [ ] 2 SQL Functions
- [ ] 3 Nested Queries
- [ ] 2 Correlated Queries

All documented in `DATABASE.md`.

---

## Running the Project

```bash
# Start PostgreSQL via Docker
docker-compose up -d db

# Install dependencies
cd backend && pnpm install

# Run migrations
pnpm run migration:run

# Seed database
pnpm run seed

# Start dev server
pnpm run start:dev

# Run tests
pnpm run test
pnpm run test:e2e
```
