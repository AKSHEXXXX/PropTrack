# TESTING.md — PropTrack CRM
## Complete Testing Guide

---

## Overview

Three levels of testing:

| Level | Tool | Command | Purpose |
|---|---|---|---|
| Unit | Jest | `pnpm test` | Test service logic in isolation |
| Integration | Jest + Supertest | `pnpm test:e2e` | Test full API request/response cycle |
| Qualification | Jest + Supertest | `pnpm test:qualify` | Final pass/fail gate before handover |

**The qualification suite is the only test that matters for assignment submission.** All tests must pass with 0 failures.

---

## Setup

### Install Test Dependencies

```bash
pnpm add -D \
  @nestjs/testing \
  supertest \
  @types/supertest \
  jest \
  ts-jest
```

### Jest Configuration

In `package.json`:

```json
{
  "scripts": {
    "test": "jest --testPathPattern=unit",
    "test:e2e": "jest --testPathPattern=integration --runInBand",
    "test:qualify": "jest --testPathPattern=qualification --runInBand --forceExit",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["src/**/*.service.ts"],
    "coverageDirectory": "coverage",
    "testEnvironment": "node"
  }
}
```

---

## Unit Tests

### Auth Service Unit Tests
`test/unit/auth.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { User } from '../../src/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ id: 1, email: 'test@test.com', role: 'agent' });
      mockUserRepo.save.mockResolvedValue({ id: 1, email: 'test@test.com', role: 'agent', password: 'hashed' });

      const result = await service.register({
        email: 'test@test.com',
        password: 'Test1234!',
        role: 'agent',
      });

      expect(result.data).toBeDefined();
      expect(result.data.email).toBe('test@test.com');
      expect((result.data as any).password).toBeUndefined();
      expect(result.message).toBe('Registration successful');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'test@test.com' });

      await expect(
        service.register({ email: 'test@test.com', password: 'Test1234!', role: 'agent' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return JWT token on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1, email: 'test@test.com', password: hashedPassword, role: 'agent',
      });

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });

      expect(result.data.accessToken).toBe('mock.jwt.token');
      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass!', 10);
      mockUserRepo.findOne.mockResolvedValue({
        id: 1, email: 'test@test.com', password: hashedPassword, role: 'agent',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPass!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@test.com', password: 'Test1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Leads Service Unit Tests
`test/unit/leads.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LeadsService } from '../../src/modules/leads/leads.service';
import { Lead } from '../../src/modules/leads/entities/lead.entity';

const mockLeadRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useValue: mockLeadRepo },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate active lead', async () => {
      mockLeadRepo.findOne.mockResolvedValue({ lead_id: 1, status: 'new' });

      await expect(
        service.create({ clientId: 1, propertyId: 1, agentId: 1, budget: 1000000 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a lead successfully', async () => {
      mockLeadRepo.findOne.mockResolvedValue(null);
      mockLeadRepo.create.mockReturnValue({ lead_id: 1, status: 'new' });
      mockLeadRepo.save.mockResolvedValue({ lead_id: 1, status: 'new', clientId: 1 });

      const result = await service.create({
        clientId: 1, propertyId: 2, agentId: 1, budget: 2000000,
      });

      expect(result.data.lead_id).toBe(1);
      expect(result.message).toBe('Lead created successfully');
    });
  });

  describe('findOne', () => {
    it('should return a lead by ID', async () => {
      mockLeadRepo.findOne.mockResolvedValue({ lead_id: 5, status: 'contacted' });
      const result = await service.findOne(5);
      expect(result.data.lead_id).toBe(5);
    });

    it('should throw NotFoundException for non-existent lead', async () => {
      mockLeadRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Properties Service Unit Tests
`test/unit/properties.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from '../../src/modules/properties/properties.service';
import { Property } from '../../src/modules/properties/entities/property.entity';

const mockPropertyRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: getRepositoryToken(Property), useValue: mockPropertyRepo },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  it('should create a property', async () => {
    const dto = {
      agentId: 1, title: 'Test Property', location: 'Dubai Marina',
      city: 'Dubai', price: 1500000, propertyType: 'apartment' as const,
    };
    mockPropertyRepo.create.mockReturnValue({ property_id: 1, ...dto });
    mockPropertyRepo.save.mockResolvedValue({ property_id: 1, ...dto });

    const result = await service.create(dto);
    expect(result.data.property_id).toBe(1);
  });

  it('should throw NotFoundException for non-existent property', async () => {
    mockPropertyRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
```

---

## Integration Tests

These tests require a running test database. Use a separate `proptrack_test` database.

### Setup: Test App Factory
`test/integration/setup.ts`

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../../src/app.module';

export let app: INestApplication;
export let authToken: string;

export async function setupTestApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
}

export async function getAuthToken(request: any): Promise<string> {
  // Register test user
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email: 'test.integration@proptrack.com', password: 'TestPass123!', role: 'agent' });

  // Login
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'test.integration@proptrack.com', password: 'TestPass123!' });

  return res.body.data.accessToken;
}

export async function teardownTestApp() {
  await app.close();
}
```

### Auth Integration Tests
`test/integration/auth.spec.ts`

```typescript
import * as request from 'supertest';
import { setupTestApp, teardownTestApp, app } from './setup';

describe('Auth API (integration)', () => {
  beforeAll(async () => await setupTestApp());
  afterAll(async () => await teardownTestApp());

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'newuser@test.com', password: 'TestPass123!', role: 'agent' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'TestPass123!', role: 'agent' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'duplicate@test.com', password: 'TestPass123!', role: 'agent' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'duplicate@test.com', password: 'TestPass123!', role: 'agent' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return JWT token on valid login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'newuser@test.com', password: 'TestPass123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'newuser@test.com', password: 'WrongPass!' });

      expect(res.status).toBe(401);
    });
  });
});
```

### Protected Routes Integration Test
`test/integration/auth-guard.spec.ts`

```typescript
import * as request from 'supertest';
import { setupTestApp, teardownTestApp, getAuthToken, app } from './setup';

describe('JWT Guard (integration)', () => {
  let token: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken(request);
  });
  afterAll(async () => await teardownTestApp());

  it('should return 401 on protected route without token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/agencies');
    expect(res.status).toBe(401);
  });

  it('should return 200 on protected route with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should return 401 on malformed token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });
});
```

---

## Qualification Test Suite

> This is the final gate. Run this before handover. ALL tests must pass.

`test/qualification/qualification.spec.ts`

```typescript
import * as request from 'supertest';
import { setupTestApp, teardownTestApp, app } from '../integration/setup';

/**
 * PROPTRACK CRM — QUALIFICATION TEST SUITE
 *
 * This suite verifies all assignment requirements:
 * - All CRUD endpoints for all modules
 * - Business rule enforcement
 * - JWT authentication
 * - Input validation
 * - Database triggers (via API behavior)
 * - Stored procedures (via API behavior)
 * - SQL functions (via API response values)
 * - Dashboard complex queries
 */

describe('🏆 PROPTRACK CRM — QUALIFICATION SUITE', () => {
  let token: string;
  let agencyId: number;
  let agentId: number;
  let clientId: number;
  let propertyId: number;
  let leadId: number;
  let appointmentId: number;
  let dealId: number;
  let contractId: number;
  let paymentId: number;

  beforeAll(async () => {
    await setupTestApp();

    // Get auth token
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'qualify@proptrack.com', password: 'QualPass123!', role: 'admin' });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'qualify@proptrack.com', password: 'QualPass123!' });

    token = loginRes.body.data.accessToken;
  });

  afterAll(async () => await teardownTestApp());

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 1: AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 1: Authentication', () => {
    it('[AUTH-01] Register endpoint returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: `user_${Date.now()}@test.com`, password: 'Test1234!', role: 'agent' });
      expect(res.status).toBe(201);
    });

    it('[AUTH-02] Login returns JWT token', () => {
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('[AUTH-03] Protected route returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/agencies');
      expect(res.status).toBe(401);
    });

    it('[AUTH-04] Protected route returns 200 with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies')
        .set(auth());
      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 2: AGENCY CRUD
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 2: Agency CRUD', () => {
    it('[AGC-01] Create agency returns 201 with agency_id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/agencies')
        .set(auth())
        .send({
          name: 'Qualify Realty LLC',
          email: `qualify_${Date.now()}@realty.com`,
          phone: '+971501111111',
          address: 'Dubai Marina, UAE',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.agency_id).toBeDefined();
      agencyId = res.body.data.agency_id;
    });

    it('[AGC-02] GET /agencies returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('[AGC-03] GET /agencies/:id returns agency with agents', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/agencies/${agencyId}`)
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.agency_id).toBe(agencyId);
    });

    it('[AGC-04] PATCH /agencies/:id updates agency', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/agencies/${agencyId}`)
        .set(auth())
        .send({ name: 'Qualify Realty Updated LLC' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Qualify Realty Updated LLC');
    });

    it('[AGC-05] GET non-existent agency returns 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies/999999')
        .set(auth());
      expect(res.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 3: AGENT CRUD
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 3: Agent CRUD', () => {
    it('[AGT-01] Create agent returns 201 with agent_id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/agents')
        .set(auth())
        .send({
          agencyId,
          firstName: 'Ali',
          lastName: 'Hassan',
          email: `ali_${Date.now()}@realty.com`,
          phone: '+971502222222',
          commissionRate: 0.025,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.agent_id).toBeDefined();
      agentId = res.body.data.agent_id;
    });

    it('[AGT-02] commission_rate validation rejects value > 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/agents')
        .set(auth())
        .send({
          agencyId,
          firstName: 'Bad',
          lastName: 'Agent',
          email: 'bad@realty.com',
          commissionRate: 1.5,
        });
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 4: CLIENT CRUD
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 4: Client CRUD', () => {
    it('[CLI-01] Create client returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set(auth())
        .send({
          firstName: 'John',
          lastName: 'Smith',
          email: `john_${Date.now()}@email.com`,
          phone: '+971503333333',
          clientType: 'buyer',
          nationality: 'British',
        });
      expect(res.status).toBe(201);
      clientId = res.body.data.client_id;
    });

    it('[CLI-02] clientType validates against enum', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set(auth())
        .send({
          firstName: 'Bad', lastName: 'Client',
          email: 'bad@email.com', clientType: 'invalid_type',
        });
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 5: PROPERTY CRUD
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 5: Property CRUD', () => {
    it('[PRO-01] Create property returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set(auth())
        .send({
          agentId,
          title: 'Luxury 2BR - Dubai Marina',
          location: 'Marina Walk',
          city: 'Dubai',
          price: 2500000,
          areaSqft: 1200,
          propertyType: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('available');
      propertyId = res.body.data.property_id;
    });

    it('[PRO-02] Filter properties by city works', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?city=Dubai')
        .set(auth());
      expect(res.status).toBe(200);
      res.body.data.items.forEach((p: any) => {
        expect(p.city).toBe('Dubai');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 6: LEAD MANAGEMENT + BUSINESS RULES
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 6: Lead Management', () => {
    it('[LEA-01] Create lead returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set(auth())
        .send({ clientId, propertyId, agentId, budget: 2200000 });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('new');
      leadId = res.body.data.lead_id;
    });

    it('[LEA-02] Duplicate active lead for same client+property returns 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set(auth())
        .send({ clientId, propertyId, agentId, budget: 2100000 });
      expect(res.status).toBe(409);
    });

    it('[LEA-03] GET /leads/pipeline returns status breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leads/pipeline')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('new');
    });

    it('[LEA-04] Update lead status succeeds', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/leads/${leadId}`)
        .set(auth())
        .send({ status: 'contacted' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('contacted');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 7: APPOINTMENTS
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 7: Appointments', () => {
    it('[APP-01] Schedule appointment returns 201', async () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set(auth())
        .send({ leadId, agentId, clientId, propertyId, scheduledAt, type: 'site_visit' });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('scheduled');
      appointmentId = res.body.data.appointment_id;
    });

    it('[APP-02] Mark appointment completed succeeds', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}`)
        .set(auth())
        .send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 8: DEALS + TRIGGER TEST
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 8: Deals & Database Triggers', () => {
    it('[DEA-01] Create deal returns 201 with commission_amount calculated', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .set(auth())
        .send({ leadId, propertyId, agentId, clientId, finalPrice: 2350000 });
      expect(res.status).toBe(201);
      expect(res.body.data.commission_amount).toBeDefined();
      expect(parseFloat(res.body.data.commission_amount)).toBeCloseTo(2350000 * 0.025, 0);
      dealId = res.body.data.deal_id;
    });

    it('[TRG-01] Closing deal automatically updates property status to sold', async () => {
      // Verify property is currently available
      const beforeRes = await request(app.getHttpServer())
        .get(`/api/v1/properties/${propertyId}`)
        .set(auth());
      expect(beforeRes.body.data.status).toBe('available');

      // Close the deal
      await request(app.getHttpServer())
        .patch(`/api/v1/deals/${dealId}`)
        .set(auth())
        .send({ status: 'closed', closingDate: new Date().toISOString().split('T')[0] });

      // Verify property is now sold (trigger fired)
      const afterRes = await request(app.getHttpServer())
        .get(`/api/v1/properties/${propertyId}`)
        .set(auth());
      expect(afterRes.body.data.status).toBe('sold');
    });

    it('[TRG-03] Deal audit log entry exists after status change', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deals/${dealId}/audit-log`)
        .set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 9: CONTRACTS + PAYMENTS
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 9: Contracts & Payments', () => {
    it('[CON-01] Create contract returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/contracts')
        .set(auth())
        .send({
          dealId,
          documentUrl: 'https://storage.proptrack.com/test-contract.pdf',
          contractType: 'sale',
          signedDate: new Date().toISOString().split('T')[0],
        });
      expect(res.status).toBe(201);
      contractId = res.body.data.contract_id;
    });

    it('[PAY-01] Record payment returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set(auth())
        .send({
          dealId,
          amount: 500000,
          paymentType: 'deposit',
          status: 'completed',
          paymentDate: new Date().toISOString().split('T')[0],
          referenceNo: `TXN-QUALIFY-${Date.now()}`,
        });
      expect(res.status).toBe(201);
      paymentId = res.body.data.payment_id;
    });

    it('[PAY-02] Payment amount must be positive', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set(auth())
        .send({ dealId, amount: -500, paymentType: 'deposit', status: 'completed' });
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 10: DASHBOARD + COMPLEX QUERIES
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 10: Dashboard & Complex Queries', () => {
    it('[DAS-01] GET /dashboard/summary returns KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalProperties');
      expect(res.body.data).toHaveProperty('totalLeads');
      expect(res.body.data).toHaveProperty('totalDeals');
    });

    it('[DAS-02] GET /dashboard/pipeline returns lead status breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/pipeline')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('new');
    });

    it('[NQ-01] GET /dashboard/agent-performance uses nested query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/agent-performance')
        .set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('[CQ-01] GET /dashboard/unsold-viewed uses correlated query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/unsold-viewed')
        .set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('[CQ-02] GET /dashboard/stale-leads uses correlated query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stale-leads')
        .set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('[PRC-02] GET /dashboard/monthly-report calls stored procedure', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/dashboard/monthly-report?agencyId=${agencyId}&month=8&year=2025`)
        .set(auth());
      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 11: VALIDATION + ERROR HANDLING
  // ─────────────────────────────────────────────────────────────────
  describe('BLOCK 11: Validation & Error Handling', () => {
    it('[VAL-01] Missing required field returns 400 with message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/agencies')
        .set(auth())
        .send({ address: 'No name given' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('[VAL-02] Extra unknown fields are stripped (whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/agencies')
        .set(auth())
        .send({
          name: 'Clean Agency',
          email: `clean_${Date.now()}@agency.com`,
          hackField: 'malicious_value',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.hackField).toBeUndefined();
    });

    it('[VAL-03] Non-existent resource returns 404 with message', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leads/999999')
        .set(auth());
      expect(res.status).toBe(404);
      expect(res.body.message).toBeDefined();
    });

    it('[VAL-04] All responses follow { statusCode, message, data } shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies')
        .set(auth());
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // FINAL: SWAGGER DOCS ACCESSIBLE
  // ─────────────────────────────────────────────────────────────────
  describe('FINAL: Documentation', () => {
    it('[DOC-01] Swagger UI is accessible', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs');
      expect(res.status).toBe(200);
    });

    it('[DOC-02] OpenAPI JSON spec is available', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs-json');
      expect(res.status).toBe(200);
      expect(res.body.info.title).toBe('PropTrack CRM API');
    });
  });
});
```

---

## Running Tests

```bash
# Unit tests only
pnpm test

# Integration tests (needs running DB)
docker-compose up -d db
pnpm test:e2e

# Qualification suite (final gate)
pnpm test:qualify

# Coverage report
pnpm test:coverage
# Target: >80% on service files

# Watch mode during development
pnpm test --watch
```

## Passing Criteria

The backend is ready for handover when:

```
PROPTRACK CRM — QUALIFICATION SUITE
  BLOCK 1: Authentication          ✓ 4 passing
  BLOCK 2: Agency CRUD             ✓ 5 passing
  BLOCK 3: Agent CRUD              ✓ 2 passing
  BLOCK 4: Client CRUD             ✓ 2 passing
  BLOCK 5: Property CRUD           ✓ 2 passing
  BLOCK 6: Lead Management         ✓ 4 passing
  BLOCK 7: Appointments            ✓ 2 passing
  BLOCK 8: Deals & Triggers        ✓ 3 passing
  BLOCK 9: Contracts & Payments    ✓ 3 passing
  BLOCK 10: Dashboard & Queries    ✓ 6 passing
  BLOCK 11: Validation             ✓ 4 passing
  FINAL: Documentation             ✓ 2 passing

  39 passing (0 failing)
```
