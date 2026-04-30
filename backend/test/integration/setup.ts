// Test app factory — shared setup for integration tests
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';

export let app: INestApplication;
export let authToken: string;

export async function setupTestApp(): Promise<void> {
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
  await app.init();
}

export async function getAuthToken(): Promise<string> {
  const email = `int_${Date.now()}@proptrack.test`;
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password, role: 'admin' });
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

export async function teardownTestApp(): Promise<void> {
  await app.close();
}
