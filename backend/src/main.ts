import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('PropTrack CRM API')
    .setDescription(
      `## PropTrack Real Estate CRM — REST API

### Features
- **Auth**: JWT-based authentication (register / login)
- **10 Feature Modules**: agencies, agents, clients, properties, leads, appointments, deals, contracts, payments, tags
- **Dashboard**: 7 analytical endpoints with nested & correlated SQL queries
- **SQL Advanced**: 3 triggers, 2 stored procedures, 2 functions, 3 nested queries, 2 correlated queries

### Quick Start
1. \`POST /api/auth/register\` — Create account
2. \`POST /api/auth/login\` — Get JWT token
3. Add \`Authorization: Bearer <token>\` to all other requests
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .setContact('PropTrack', 'https://github.com/AKSHEXXXX/PropTrack', '')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 PropTrack CRM running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at:           http://localhost:${port}/api/docs`);
  console.log(`🌱 Seed data:                 pnpm seed\n`);
}

bootstrap();
