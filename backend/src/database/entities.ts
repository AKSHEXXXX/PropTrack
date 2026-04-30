import { User } from '../auth/entities/user.entity';
import { Agency } from '../modules/agencies/entities/agency.entity';
import { Agent } from '../modules/agents/entities/agent.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Client } from '../modules/clients/entities/client.entity';
import { Contract } from '../modules/contracts/entities/contract.entity';
import { Deal } from '../modules/deals/entities/deal.entity';
import { Lead } from '../modules/leads/entities/lead.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { PropertyImage } from '../modules/properties/entities/property-image.entity';
import { Property } from '../modules/properties/entities/property.entity';
import { Tag } from '../modules/tags/entities/tag.entity';
import { DealAuditLog } from './entities/deal-audit-log.entity';

export const APP_ENTITIES = [
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
  DealAuditLog,
] as const;
