import request = require('supertest');
import { app, setupTestApp, teardownTestApp, getAuthToken } from './setup';

/**
 * Integration tests for the JwtAuthGuard applied to protected routes.
 * Uses GET /api/v1/agencies as a representative guarded endpoint —
 * the @UseGuards(JwtAuthGuard) decorator is declared at the class level
 * on AgenciesController so every route under it requires a valid JWT.
 *
 * Cases covered:
 *   1. No Authorization header  → 401 Unauthorized
 *   2. Valid Bearer token        → 200 OK
 *   3. Malformed Bearer token    → 401 Unauthorized
 */
describe('JWT Auth Guard (Integration)', () => {
  let token: string;

  beforeAll(async () => {
    await setupTestApp();
    // Registers a fresh user and returns their signed JWT
    token = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('GET /agencies', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/agencies');

      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('should return 200 when a valid Bearer token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      // Paginated envelope: { items: [], total, page, limit, totalPages }
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should return 401 when the Bearer token is malformed', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/agencies')
        .set('Authorization', 'Bearer this.is.not.valid');

      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });
  });
});
