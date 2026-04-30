import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Auth
import { AuthModule } from './auth/auth.module';

// Feature modules
import { AgenciesModule } from './modules/agencies/agencies.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DealsModule } from './modules/deals/deals.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TagsModule } from './modules/tags/tags.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Entities
import { User } from './auth/entities/user.entity';
import { Agency } from './modules/agencies/entities/agency.entity';
import { Agent } from './modules/agents/entities/agent.entity';
import { Client } from './modules/clients/entities/client.entity';
import { Property } from './modules/properties/entities/property.entity';
import { PropertyImage } from './modules/properties/entities/property-image.entity';
import { Lead } from './modules/leads/entities/lead.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';
import { Deal } from './modules/deals/entities/deal.entity';
import { Contract } from './modules/contracts/entities/contract.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { Tag } from './modules/tags/entities/tag.entity';

@Module({
  imports: [
    // Global config (reads .env)
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'proptrack'),
        password: configService.get<string>('DB_PASSWORD', 'proptrack_secret'),
        database: configService.get<string>('DB_DATABASE', 'proptrack_db'),
        entities: [
          User,
          Agency,
          Agent,
          Client,
          Property,
          PropertyImage,
          Lead,
          Appointment,
          Deal,
          Contract,
          Payment,
          Tag,
        ],
        // Auto-sync schema in dev (use migrations in production)
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Auth
    AuthModule,

    // Feature modules
    AgenciesModule,
    AgentsModule,
    ClientsModule,
    PropertiesModule,
    LeadsModule,
    AppointmentsModule,
    DealsModule,
    ContractsModule,
    PaymentsModule,
    TagsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
