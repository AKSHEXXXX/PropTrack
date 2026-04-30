import request from 'supertest';
import { app, setupTestApp, teardownTestApp } from './setup';

/**
 * Integration tests for Auth endpoints:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *
 * Response envelope (ResponseInterceptor):
 *   { statusCode: number, message: string, data: unknown }
 *
 * Error envelope (AllExceptionsFilter):
 *   { statusCode: number, message: string|string[], error: string, path: string, timestamp: string }
 */
describe('Auth Endpoints (Integration)', () => {
  // Unique prefix per test-suite run so parallel CI shards never collide
  let baseEmail: string;

  beforeAll(async () => {
    await setupTestApp();
    baseEmail = `auth_spec_${Date.now()}`;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  // ─── POST /auth/register ─────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('should return 201 with user data and no password field', async () => {
      const email = `${baseEmail}_new@proptrack.test`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TestPass123!', role: 'agent' });

      expect(res.status).toBe(201);

      // Envelope shape
      expect(res.body.statusCode).toBe(201);
      expect(res.body.message).toBe('Registration successful');

      // Returned user fields
      const user = res.body.data;
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.role).toBe('agent');

      // Password must never be exposed
      expect(user.password).toBeUndefined();
    });

    it('should return 400 for an invalid email address', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPass123!',
          role: 'agent',
        });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('should return 409 when the email is already registered', async () => {
      const email = `${baseEmail}_dup@proptrack.test`;

      // First registration — must succeed
      const first = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TestPass123!', role: 'agent' });
      expect(first.status).toBe(201);

      // Second registration with the same email — must be rejected
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TestPass123!', role: 'agent' });

      expect(res.status).toBe(409);
      expect(res.body.statusCode).toBe(409);
    });
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    const PASSWORD = 'TestPass123!';
    let loginEmail: string;

    // Create the account once before login tests run
    beforeAll(async () => {
      loginEmail = `${baseEmail}_login@proptrack.test`;
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: loginEmail, password: PASSWORD, role: 'manager' });
    });

    it('should return 200 with a string accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: loginEmail, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');

      // Token must be a non-empty string
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.length).toBeGreaterThan(0);
    });

    it('should return 401 for a wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: loginEmail, password: 'WrongPassword99!' });

      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });
  });
});
