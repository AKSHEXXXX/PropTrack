import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newDb } from 'pg-mem';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { APP_ENTITIES } from './database/entities';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DealsModule } from './modules/deals/deals.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { TagsModule } from './modules/tags/tags.module';

function createBaseTypeOrmOptions(
  configService: ConfigService,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'proptrack'),
    password: configService.get<string>('DB_PASSWORD', 'proptrack_secret'),
    database: configService.get<string>('DB_DATABASE', 'proptrack_db'),
    entities: [...APP_ENTITIES],
    synchronize: process.env.DB_TYPE === 'pg-mem', // Only auto-sync for tests
    logging: configService.get<string>('NODE_ENV') === 'development',
  };
}

async function createTestDataSource(
  options: DataSourceOptions,
): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'pg-mem',
  });
  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'proptrack_test',
  });

  const dataSource = db.adapters.createTypeormDataSource(options);
  await dataSource.initialize();
  return dataSource;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createBaseTypeOrmOptions(configService),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }

        if (process.env.DB_TYPE === 'pg-mem') {
          return createTestDataSource(options);
        }

        return new DataSource(options).initialize();
      },
    }),
    AuthModule,
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
