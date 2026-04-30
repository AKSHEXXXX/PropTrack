import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealAuditLog } from '../../database/entities/deal-audit-log.entity';
import { Agent } from '../agents/entities/agent.entity';
import { Property } from '../properties/entities/property.entity';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { Deal } from './entities/deal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Agent, Property, DealAuditLog])],
  providers: [DealsService],
  controllers: [DealsController],
  exports: [DealsService],
})
export class DealsModule {}
