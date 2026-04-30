import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DealAuditLog } from '../../database/entities/deal-audit-log.entity';
import { Agent } from '../agents/entities/agent.entity';
import {
  Property,
  PropertyStatus,
} from '../properties/entities/property.entity';
import { CreateDealDto, DealFilterDto, UpdateDealDto } from './dto/deal.dto';
import { Deal, DealStatus } from './entities/deal.entity';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal) private readonly dealRepo: Repository<Deal>,
    @InjectRepository(Agent) private readonly agentRepo: Repository<Agent>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(DealAuditLog)
    private readonly auditLogRepo: Repository<DealAuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  private async calculateCommission(dealId: number): Promise<number> {
    const deal = await this.dealRepo.findOne({ where: { deal_id: dealId } });
    if (!deal) {
      throw new NotFoundException(`Deal #${dealId} not found`);
    }

    const agent = await this.agentRepo.findOne({
      where: { agent_id: deal.agent_id },
    });
    const rate = Number(agent?.commission_rate ?? 0);
    return Number((Number(deal.final_price) * rate).toFixed(2));
  }

  private async writeAuditLog(
    dealId: number,
    newStatus: DealStatus,
    oldStatus: DealStatus | null = null,
  ): Promise<void> {
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        deal_id: dealId,
        old_status: oldStatus,
        new_status: newStatus,
      }),
    );
  }

  private async markPropertySold(propertyId: number): Promise<void> {
    await this.propertyRepo.update(propertyId, {
      status: PropertyStatus.SOLD,
    });
  }

  async create(dto: CreateDealDto) {
    const deal = this.dealRepo.create({
      lead_id: dto.leadId,
      property_id: dto.propertyId,
      agent_id: dto.agentId,
      client_id: dto.clientId,
      final_price: dto.finalPrice,
      deal_date: dto.dealDate ? new Date(dto.dealDate) : new Date(),
    });
    const saved = await this.dealRepo.save(deal);
    saved.commission_amount = await this.calculateCommission(saved.deal_id);
    const updated = await this.dealRepo.save(saved);
    await this.writeAuditLog(updated.deal_id, updated.status, null);
    return { data: updated, message: 'Deal created successfully' };
  }

  async findAll(filter: DealFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);
    const qb = this.dealRepo
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.agent', 'agent')
      .leftJoinAndSelect('deal.client', 'client')
      .leftJoinAndSelect('deal.property', 'property');
    if (filter.agentId) {
      qb.andWhere('deal.agent_id = :agentId', {
        agentId: parseInt(filter.agentId, 10),
      });
    }
    if (filter.status) {
      qb.andWhere('deal.status = :status', { status: filter.status });
    }
    if (filter.from) {
      qb.andWhere('deal.deal_date >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('deal.deal_date <= :to', { to: filter.to });
    }
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('deal.created_at', 'DESC')
      .getManyAndCount();
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Deals fetched successfully',
    };
  }

  async findOne(id: number) {
    const deal = await this.dealRepo.findOne({
      where: { deal_id: id },
      relations: ['agent', 'client', 'property', 'contracts', 'payments'],
    });
    if (!deal) throw new NotFoundException(`Deal #${id} not found`);
    return { data: deal, message: 'Deal fetched successfully' };
  }

  async update(id: number, dto: UpdateDealDto) {
    const deal = await this.dealRepo.findOne({ where: { deal_id: id } });
    if (!deal) throw new NotFoundException(`Deal #${id} not found`);

    const previousStatus = deal.status;
    if (dto.status !== undefined) deal.status = dto.status;
    if (dto.finalPrice !== undefined) deal.final_price = dto.finalPrice;
    if (dto.closingDate !== undefined) {
      deal.closing_date = new Date(dto.closingDate);
    }

    if (dto.finalPrice !== undefined || dto.status !== undefined) {
      deal.commission_amount = await this.calculateCommission(id);
    }

    const saved = await this.dealRepo.save(deal);

    if (
      saved.status === DealStatus.CLOSED &&
      previousStatus !== DealStatus.CLOSED
    ) {
      await this.markPropertySold(saved.property_id);
    }

    if (dto.status !== undefined && previousStatus !== saved.status) {
      await this.writeAuditLog(saved.deal_id, saved.status, previousStatus);
    }

    return { data: saved, message: 'Deal updated successfully' };
  }

  async remove(id: number) {
    const deal = await this.dealRepo.findOne({ where: { deal_id: id } });
    if (!deal) throw new NotFoundException(`Deal #${id} not found`);
    const previousStatus = deal.status;
    deal.status = DealStatus.CANCELLED;
    const saved = await this.dealRepo.save(deal);
    await this.writeAuditLog(saved.deal_id, saved.status, previousStatus);
    return { data: saved, message: 'Deal cancelled successfully' };
  }

  async getAuditLog(dealId: number) {
    const logs = await this.auditLogRepo.find({
      where: { deal_id: dealId },
      order: { changed_at: 'ASC' },
    });
    return { data: logs, message: 'Audit log fetched successfully' };
  }
}
