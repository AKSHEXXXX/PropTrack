/**
 * PropTrack CRM — Qualification Test Suite
 * 39 tests across 12 blocks — must pass 100% before handover
 *
 * Run: pnpm test:qualify
 * Requires: running PostgreSQL (docker-compose up -d db)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import request = require('supertest');
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

// ─── Shared State ─────────────────────────────────────────────────────────────

let app: INestApplication;
let token: string;

const ids: Record<string, number> = {
  agencyId: 0,
  agentId: 0,
  clientId: 0,
  propertyId: 0,
  leadId: 0,
  appointmentId: 0,
  dealId: 0,
  contractId: 0,
  paymentId: 0,
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PropTrack CRM API')
    .setDescription('Real Estate CRM Backend — NestJS + TypeORM + PostgreSQL')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();

  // Apply advanced SQL (functions, triggers, stored procedures)
  const dataSource = moduleFixture.get<DataSource>(DataSource);
  const sqlPath = path.join(__dirname, '../../src/database/sql/advanced.sql');
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    try {
      await dataSource.query(sql);
    } catch {
      // Functions/triggers may already exist — safe to continue
    }
  }

  // Obtain auth token for all protected tests
  const email = `qualify_${Date.now()}@proptrack.test`;
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password: 'QualPass123!', role: 'admin' });
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: 'QualPass123!' });
  token = loginRes.body.data.accessToken;
}, 30_000);

afterAll(async () => {
  await app.close();
});

function auth() {
  return { Authorization: `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 1: Authentication
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 1: Authentication', () => {
  const email = `auth_block_${Date.now()}@proptrack.test`;
  const password = 'TestPass123!';

  it('[AUTH-01] Register endpoint returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, role: 'agent' })
      .expect(201);

    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toContain('Registration successful');
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('[AUTH-02] Login returns JWT token (3-part structure)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.accessToken.split('.').length).toBe(3);
  });

  it('[AUTH-03] Protected route returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/v1/agencies').expect(401);
  });

  it('[AUTH-04] Protected route returns 200 with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set(auth())
      .expect(200);

    expect(res.body.statusCode).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2: Agency CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 2: Agency CRUD', () => {
  it('[AGC-01] Create agency → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/agencies')
      .set(auth())
      .send({
        name: `QA Agency ${Date.now()}`,
        address: 'Business Bay, Dubai',
        phone: '+971500001111',
        email: `qa_agency_${Date.now()}@qualify.test`,
      })
      .expect(201);

    expect(res.body.data.agency_id).toBeDefined();
    ids.agencyId = res.body.data.agency_id;
  });

  it('[AGC-02] GET /agencies → 200, data.items is array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set(auth())
      .expect(200);

    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.total).toBeGreaterThan(0);
  });

  it('[AGC-03] GET /agencies/:id → 200, data.agency_id matches', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/agencies/${ids.agencyId}`)
      .set(auth())
      .expect(200);

    expect(res.body.data.agency_id).toBe(ids.agencyId);
    expect(res.body.data.agents).toBeInstanceOf(Array);
  });

  it('[AGC-04] PATCH /agencies/:id → 200, data.name updated', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/agencies/${ids.agencyId}`)
      .set(auth())
      .send({ name: 'QA Agency (Updated)' })
      .expect(200);

    expect(res.body.data.name).toBe('QA Agency (Updated)');
  });

  it('[AGC-05] GET /agencies/999999 → 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/agencies/999999')
      .set(auth())
      .expect(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 3: Agent CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 3: Agent CRUD', () => {
  it('[AGT-01] Create agent → 201, save agentId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set(auth())
      .send({
        agencyId: ids.agencyId,
        firstName: 'QA',
        lastName: 'Agent',
        email: `qa_agent_${Date.now()}@qualify.test`,
        phone: '+971500002222',
        commissionRate: 0.025,
      })
      .expect(201);

    expect(res.body.data.agent_id).toBeDefined();
    ids.agentId = res.body.data.agent_id;
  });

  it('[AGT-02] commissionRate > 1 → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set(auth())
      .send({
        agencyId: ids.agencyId,
        firstName: 'Bad',
        lastName: 'Rate',
        email: `bad_rate_${Date.now()}@qualify.test`,
        commissionRate: 1.5,
      })
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 4: Client CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 4: Client CRUD', () => {
  it('[CLI-01] Create client → 201, save clientId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(auth())
      .send({
        firstName: 'QA',
        lastName: 'Buyer',
        email: `qa_buyer_${Date.now()}@qualify.test`,
        phone: '+971500003333',
        clientType: 'buyer',
        nationality: 'British',
      })
      .expect(201);

    expect(res.body.data.client_id).toBeDefined();
    ids.clientId = res.body.data.client_id;
  });

  it('[CLI-02] clientType: "invalid_type" → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(auth())
      .send({
        firstName: 'Bad',
        lastName: 'Type',
        clientType: 'invalid_type',
      })
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 5: Property CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 5: Property CRUD', () => {
  it('[PRO-01] Create property → 201, status === available, save propertyId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth())
      .send({
        agentId: ids.agentId,
        title: 'QA Test Apartment - Downtown Dubai',
        location: 'Sheikh Mohammed Bin Rashid Blvd',
        city: 'Dubai',
        price: 2350000,
        areaSqft: 1200,
        propertyType: 'apartment',
        status: 'available',
        bedrooms: 2,
        bathrooms: 2,
      })
      .expect(201);

    expect(res.body.data.property_id).toBeDefined();
    expect(res.body.data.status).toBe('available');
    ids.propertyId = res.body.data.property_id;
  });

  it('[PRO-02] GET /properties?city=Dubai → 200, all items have city === "Dubai"', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/properties?city=Dubai')
      .set(auth())
      .expect(200);

    expect(res.body.data.items.length).toBeGreaterThan(0);
    res.body.data.items.forEach((p: any) =>
      expect(p.city.toLowerCase()).toContain('dubai'),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 6: Lead Management
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 6: Lead Management', () => {
  it('[LEA-01] Create lead → 201, status === new, save leadId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth())
      .send({
        clientId: ids.clientId,
        propertyId: ids.propertyId,
        agentId: ids.agentId,
        budget: 2200000,
        notes: 'Client prefers high floor, sea view',
      })
      .expect(201);

    expect(res.body.data.lead_id).toBeDefined();
    expect(res.body.data.status).toBe('new');
    ids.leadId = res.body.data.lead_id;
  });

  it('[LEA-02] Duplicate lead same client+property → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth())
      .send({
        clientId: ids.clientId,
        propertyId: ids.propertyId,
        agentId: ids.agentId,
        budget: 2200000,
      })
      .expect(409);
  });

  it('[LEA-03] GET /leads/pipeline → 200, response includes "new" status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/leads/pipeline')
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    const statuses = res.body.data.map((r: any) => r.status);
    expect(statuses).toContain('new');
  });

  it('[LEA-04] PATCH /leads/:id { status: contacted } → 200, status updated', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/leads/${ids.leadId}`)
      .set(auth())
      .send({ status: 'contacted' })
      .expect(200);

    expect(res.body.data.status).toBe('contacted');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 7: Appointments
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 7: Appointments', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  it('[APP-01] Schedule site_visit → 201, status === scheduled', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set(auth())
      .send({
        leadId: ids.leadId,
        agentId: ids.agentId,
        clientId: ids.clientId,
        propertyId: ids.propertyId,
        scheduledAt: tomorrow,
        type: 'site_visit',
        notes: 'Client wants to see parking',
      })
      .expect(201);

    expect(res.body.data.appointment_id).toBeDefined();
    expect(res.body.data.status).toBe('scheduled');
    ids.appointmentId = res.body.data.appointment_id;
  });

  it('[APP-02] PATCH /appointments/:id { status: completed } → 200', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${ids.appointmentId}`)
      .set(auth())
      .send({ status: 'completed' })
      .expect(200);

    expect(res.body.data.status).toBe('completed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 8: Deals & Database Triggers
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 8: Deals & Database Triggers', () => {
  it('[DEA-01] Create deal → 201, commission_amount ≈ finalPrice × commissionRate', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/deals')
      .set(auth())
      .send({
        leadId: ids.leadId,
        propertyId: ids.propertyId,
        agentId: ids.agentId,
        clientId: ids.clientId,
        finalPrice: 2350000,
        dealDate: new Date().toISOString().split('T')[0],
      })
      .expect(201);

    expect(res.body.data.deal_id).toBeDefined();
    ids.dealId = res.body.data.deal_id;

    // fn_calculate_commission: 2350000 × 0.025 = 58750
    const commission = Number(res.body.data.commission_amount);
    expect(commission).toBeGreaterThan(0);
    expect(commission).toBeCloseTo(2350000 * 0.025, 0);
  });

  it('[TRG-01] Closing deal → property.status automatically becomes "sold"', async () => {
    // Before: property should still be available
    const before = await request(app.getHttpServer())
      .get(`/api/v1/properties/${ids.propertyId}`)
      .set(auth());
    expect(before.body.data.status).toBe('available');

    // Close the deal
    const closingDate = new Date().toISOString().split('T')[0];
    const dealRes = await request(app.getHttpServer())
      .patch(`/api/v1/deals/${ids.dealId}`)
      .set(auth())
      .send({ status: 'closed', closingDate })
      .expect(200);
    expect(dealRes.body.data.status).toBe('closed');

    // After: trigger TRG-01 should have set property → sold
    const after = await request(app.getHttpServer())
      .get(`/api/v1/properties/${ids.propertyId}`)
      .set(auth());
    expect(after.body.data.status).toBe('sold');
  });

  it('[TRG-03] GET /deals/:id/audit-log → array with entries (trigger fired)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/deals/${ids.dealId}/audit-log`)
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    // Should have a 'closed' entry from TRG-01
    const closedEntry = res.body.data.find(
      (e: any) => e.new_status === 'closed',
    );
    expect(closedEntry).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 9: Contracts & Payments
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 9: Contracts & Payments', () => {
  it('[CON-01] Create contract → 201, save contractId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/contracts')
      .set(auth())
      .send({
        dealId: ids.dealId,
        documentUrl: 'https://storage.proptrack.com/contracts/qualify_sale.pdf',
        contractType: 'sale',
        signedDate: new Date().toISOString().split('T')[0],
      })
      .expect(201);

    expect(res.body.data.contract_id).toBeDefined();
    expect(res.body.data.status).toBe('draft');
    ids.contractId = res.body.data.contract_id;
  });

  it('[PAY-01] Create payment → 201, save paymentId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set(auth())
      .send({
        dealId: ids.dealId,
        amount: 500000,
        paymentType: 'deposit',
        status: 'completed',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNo: `QA-DEP-${Date.now()}`,
      })
      .expect(201);

    expect(res.body.data.payment_id).toBeDefined();
    ids.paymentId = res.body.data.payment_id;
  });

  it('[PAY-02] Payment amount: -500 → 400 (validation)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set(auth())
      .send({
        dealId: ids.dealId,
        amount: -500,
        paymentType: 'deposit',
      })
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 10: Dashboard & Complex Queries
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 10: Dashboard & Complex Queries', () => {
  it('[DAS-01] GET /dashboard/summary → 200, has totalProperties, totalLeads, totalDeals', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set(auth())
      .expect(200);

    const d = res.body.data;
    expect(Number(d.totalProperties)).toBeGreaterThan(0);
    expect(Number(d.totalLeads)).toBeGreaterThan(0);
    expect(d.totalDeals).toBeDefined();
  });

  it('[DAS-02] GET /dashboard/pipeline → 200, data includes "new" status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/pipeline')
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    const statuses = res.body.data.map((r: any) => r.status);
    expect(statuses).toContain('new');
  });

  it('[NQ-01] GET /dashboard/agent-performance → 200, array (nested query)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/agent-performance')
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('[CQ-01] GET /dashboard/unsold-viewed → 200, array (correlated query)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/unsold-viewed')
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('[CQ-02] GET /dashboard/stale-leads → 200, array (correlated query)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/stale-leads')
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('[PRC-02] GET /dashboard/monthly-report → 200 (calls stored procedure)', async () => {
    const now = new Date();
    const res = await request(app.getHttpServer())
      .get(
        `/api/v1/dashboard/monthly-report?agencyId=${ids.agencyId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      )
      .set(auth())
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.message).toContain('Monthly report');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 11: Validation & Error Handling
// ─────────────────────────────────────────────────────────────────────────────

describe('BLOCK 11: Validation & Error Handling', () => {
  it('[VAL-01] POST /agencies missing name → 400, message defined', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/agencies')
      .set(auth())
      .send({ address: 'No name given', email: 'nope@test.com' })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  it('[VAL-02] POST /agencies with hackField → 201, data.hackField undefined (whitelist)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/agencies')
      .set(auth())
      .send({
        name: `Whitelist Test ${Date.now()}`,
        email: `whitelist_${Date.now()}@qualify.test`,
        hackField: 'malicious_injection',
      })
      .expect(201);

    expect(res.body.data.hackField).toBeUndefined();
  });

  it('[VAL-03] GET /leads/999999 → 404, message defined', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/leads/999999')
      .set(auth())
      .expect(404);

    expect(res.body.message).toBeDefined();
  });

  it('[VAL-04] GET /agencies → body has statusCode, message, data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/agencies')
      .set(auth())
      .expect(200);

    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FINAL: Documentation
// ─────────────────────────────────────────────────────────────────────────────

describe('FINAL: Documentation', () => {
  it('[DOC-01] GET /api/docs → 200 (Swagger UI accessible)', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200);
  });

  it('[DOC-02] GET /api/docs-json → 200, title === "PropTrack CRM API"', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(res.body.info.title).toBe('PropTrack CRM API');
  });
});
