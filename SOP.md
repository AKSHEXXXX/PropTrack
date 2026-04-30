# BACKEND_SOP.md — Akshat's Build Guide
## Standard Operating Procedure: Backend Development

> Follow this file top to bottom. Do not skip phases.
> Every step has a verification checkpoint. Do not move to the next phase until the checkpoint passes.

---

## Phase 0 — Environment Setup

### Step 0.1 — Install Prerequisites

```bash
# Node.js 20+ (use nvm)
nvm install 20
nvm use 20

# pnpm
npm install -g pnpm

# NestJS CLI
pnpm add -g @nestjs/cli

# Docker Desktop (install manually from docker.com)
# Verify
docker --version
docker-compose --version
```

### Step 0.2 — Scaffold the Project

```bash
# Create NestJS project
nest new backend --package-manager pnpm --strict

cd backend

# Install all dependencies at once
pnpm add \
  @nestjs/typeorm typeorm pg \
  @nestjs/jwt @nestjs/passport passport passport-jwt \
  @nestjs/swagger swagger-ui-express \
  @nestjs/config \
  class-validator class-transformer \
  bcrypt \
  reflect-metadata

pnpm add -D \
  @types/passport-jwt \
  @types/bcrypt \
  @types/supertest \
  supertest
```

### Step 0.3 — Create Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    container_name: proptrack_db
    environment:
      POSTGRES_USER: proptrack
      POSTGRES_PASSWORD: proptrack_secret
      POSTGRES_DB: proptrack_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./src/database/sql:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U proptrack"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: proptrack_backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USERNAME: proptrack
      DB_PASSWORD: proptrack_secret
      DB_DATABASE: proptrack_db
      JWT_SECRET: dev_jwt_secret
      JWT_EXPIRES_IN: 7d
      PORT: 3000
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  pgdata:
```

### Step 0.4 — Environment File

Create `.env` in backend root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=proptrack
DB_PASSWORD=proptrack_secret
DB_DATABASE=proptrack_db
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Create `.env.example` (same keys, no values — commit this):

```env
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
JWT_SECRET=
JWT_EXPIRES_IN=
PORT=
NODE_ENV=
FRONTEND_URL=
```

### Step 0.5 — Configure AppModule

Replace `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Step 0.6 — Configure main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('PropTrack CRM API')
    .setDescription('Real Estate CRM Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`PropTrack API running on: http://localhost:${process.env.PORT || 3000}/api/v1`);
  console.log(`Swagger docs: http://localhost:${process.env.PORT || 3000}/api/docs`);
}
bootstrap();
```

### ✅ Phase 0 Checkpoint

```bash
docker-compose up -d db
pnpm run start:dev
# Should see: PropTrack API running on: http://localhost:3000/api/v1
# Visit http://localhost:3000/api/docs — should see Swagger UI
```

---

## Phase 1 — Common Infrastructure

Build these before any feature module. Every module depends on them.

### Step 1.1 — Response Interceptor

Create `src/common/interceptors/response.interceptor.ts`:

```typescript
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: data?.message || 'Success',
        data: data?.data !== undefined ? data.data : data,
      })),
    );
  }
}
```

Register in `main.ts`:
```typescript
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
app.useGlobalInterceptors(new ResponseInterceptor());
```

### Step 1.2 — Global Exception Filter

Create `src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

Register in `main.ts`:
```typescript
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
app.useGlobalFilters(new AllExceptionsFilter());
```

### Step 1.3 — Pagination DTO

Create `src/common/dto/pagination.dto.ts`:

```typescript
import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Step 1.4 — Auth Module

```bash
nest generate module auth
nest generate service auth
nest generate controller auth
```

Create `src/auth/entities/user.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'agent' })
  role: string;

  @Column({ nullable: true })
  agentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Create `src/auth/dto/auth.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'agent@proptrack.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'agent' })
  @IsString()
  role: string;
}

export class LoginDto {
  @ApiProperty({ example: 'agent@proptrack.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}
```

Create `src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hashed });
    await this.userRepo.save(user);

    const { password, ...result } = user;
    return { data: result, message: 'Registration successful' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      data: { accessToken: token, role: user.role },
      message: 'Login successful',
    };
  }
}
```

Create `src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Create `src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### ✅ Phase 1 Checkpoint

```bash
# POST http://localhost:3000/api/v1/auth/register
# Body: { "email": "test@test.com", "password": "Test1234!", "role": "agent" }
# Should return 201 with user data

# POST http://localhost:3000/api/v1/auth/login
# Body: { "email": "test@test.com", "password": "Test1234!" }
# Should return 200 with accessToken
```

---

## Phase 2 — Feature Modules

Build modules in this exact order (each depends on the previous):

```
1. agencies
2. agents
3. clients
4. properties
5. leads
6. appointments
7. deals
8. contracts
9. payments
10. tags
11. dashboard
```

### Module Template Pattern

Every module follows this exact pattern. Use `agencies` as the reference.

```bash
nest generate module modules/agencies
nest generate service modules/agencies
nest generate controller modules/agencies
```

**Entity structure template:**

```typescript
// src/modules/agencies/entities/agency.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn()
  agency_id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, unique: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Agent, (agent) => agent.agency)
  agents: Agent[];
}
```

**Service structure template:**

```typescript
// src/modules/agencies/agencies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from './entities/agency.entity';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
  ) {}

  async create(dto: CreateAgencyDto) {
    const agency = this.agencyRepo.create(dto);
    const saved = await this.agencyRepo.save(agency);
    return { data: saved, message: 'Agency created successfully' };
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [items, total] = await this.agencyRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Agencies fetched successfully',
    };
  }

  async findOne(id: number) {
    const agency = await this.agencyRepo.findOne({
      where: { agency_id: id },
      relations: ['agents'],
    });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);
    return { data: agency, message: 'Agency fetched successfully' };
  }

  async update(id: number, dto: UpdateAgencyDto) {
    const agency = await this.agencyRepo.findOne({ where: { agency_id: id } });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);
    Object.assign(agency, dto);
    const saved = await this.agencyRepo.save(agency);
    return { data: saved, message: 'Agency updated successfully' };
  }

  async remove(id: number) {
    const agency = await this.agencyRepo.findOne({ where: { agency_id: id } });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);
    await this.agencyRepo.remove(agency);
    return { data: null, message: 'Agency deleted successfully' };
  }
}
```

**Controller structure template:**

```typescript
// src/modules/agencies/agencies.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Agencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agencies (paginated)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.agenciesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgencyDto) {
    return this.agenciesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.remove(id);
  }
}
```

Apply this exact pattern to all 10 modules. The entities, DTOs, and specific business logic differ — the structure never does.

### ✅ Phase 2 Checkpoint

For each module, verify:
```bash
# GET http://localhost:3000/api/v1/{module}
# Should return paginated empty array with 200

# POST http://localhost:3000/api/v1/{module}
# With valid body — should return 201 with created entity

# POST with missing required field
# Should return 400 Bad Request with validation message
```

---

## Phase 3 — Advanced SQL

> This is the assignment-critical phase. Every SQL object here is directly graded.

All SQL goes in `src/database/sql/advanced.sql`.

See `DATABASE.md` for the complete SQL file.

After writing all SQL:

```bash
# Apply to running database
docker exec -i proptrack_db psql -U proptrack -d proptrack_db < src/database/sql/advanced.sql

# Verify triggers exist
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers;"

# Verify functions exist
docker exec proptrack_db psql -U proptrack -d proptrack_db \
  -c "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public';"
```

### ✅ Phase 3 Checkpoint

```bash
# Test trigger: close a deal and verify property status changes
# Test function: call fn_calculate_commission with a deal_id
# Test procedure: call sp_auto_assign_lead with a lead_id
# All must return expected results
```

---

## Phase 4 — Dashboard Module

The dashboard module uses the complex queries from `DATABASE.md`.

```bash
nest generate module modules/dashboard
nest generate service modules/dashboard
nest generate controller modules/dashboard
```

The dashboard service uses raw TypeORM query builder for the complex SQL queries.
See `DATABASE.md` for all dashboard query implementations.

### ✅ Phase 4 Checkpoint

```bash
# GET http://localhost:3000/api/v1/dashboard/summary
# Should return counts for leads, deals, properties

# GET http://localhost:3000/api/v1/dashboard/agent-performance
# Should return per-agent stats

# GET http://localhost:3000/api/v1/dashboard/stale-leads
# Should return leads with no activity in 7+ days
```

---

## Phase 5 — Seed Data

Create `src/database/seeds/seed.ts`:

```typescript
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'proptrack',
    password: process.env.DB_PASSWORD || 'proptrack_secret',
    database: process.env.DB_DATABASE || 'proptrack_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();

  // Insert 1 agency, 3 agents, 10 clients, 15 properties, 20 leads
  // See full seed implementation in seeds/data/ folder

  console.log('Seeding complete');
  await dataSource.destroy();
}

seed().catch(console.error);
```

Add to `package.json` scripts:
```json
"seed": "ts-node src/database/seeds/seed.ts"
```

### ✅ Phase 5 Checkpoint

```bash
pnpm run seed
# Verify in Swagger: GET /api/v1/properties should return 15 items
# GET /api/v1/leads should return 20 items
```

---

## Phase 6 — Handover Preparation

Before handing over to Vritti (frontend):

### Step 6.1 — Generate API Type Exports

Create `src/shared/types/index.ts` with all enums and response interfaces that Vritti's React code will import.

### Step 6.2 — Verify CORS

Confirm Vritti's dev server (`http://localhost:5173`) is in the CORS allowed origins.

### Step 6.3 — Write API Cheat Sheet

Create `FRONTEND_HANDOVER.md` with:
- Base URL
- Auth header format: `Authorization: Bearer <token>`
- All endpoint URLs
- Request/response examples for each endpoint

### Step 6.4 — Final Verification

```bash
# Run full test suite
pnpm run test          # Unit tests — must pass 100%
pnpm run test:e2e      # Integration tests — must pass 100%
pnpm run test:qualify  # Qualification suite — must pass 100%
```

---

## Gitignore

Create `.gitignore` in project root:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# TypeScript
*.tsbuildinfo

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Test coverage
coverage/

# Docker volumes
pgdata/

# Misc
*.pem
```
