import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Deal, DealStatus } from './entities/deal.entity';
import { CreateDealDto, UpdateDealDto, DealFilterDto } from './dto/deal.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal) private readonly dealRepo: Repository<Deal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateDealDto) {
    const deal = this.dealRepo.create({
      lead_id: dto.leadId, property_id: dto.propertyId,
      agent_id: dto.agentId, client_id: dto.clientId,
      final_price: dto.finalPrice, deal_date: dto.dealDate ? new Date(dto.dealDate) : new Date(),
    });
    const saved = await this.dealRepo.save(deal);
    // Calculate commission via SQL function
    const result = await this.dataSource.query(
      `UPDATE deals SET commission_amount = fn_calculate_commission($1) WHERE deal_id = $1 RETURNING *`,
      [saved.deal_id],
    );
    return { data: result[0] || saved, message: 'Deal created successfully' };
  }

  async findAll(filter: DealFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);
    const qb = this.dealRepo.createQueryBuilder('deal')
      .leftJoinAndSelect('deal.agent', 'agent')
      .leftJoinAndSelect('deal.client', 'client')
      .leftJoinAndSelect('deal.property', 'property');
    if (filter.agentId) qb.andWhere('deal.agent_id = :agentId', { agentId: parseInt(filter.agentId, 10) });
    if (filter.status) qb.andWhere('deal.status = :status', { status: filter.status });
    if (filter.from) qb.andWhere('deal.deal_date >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('deal.deal_date <= :to', { to: filter.to });
    const [items, total] = await qb.skip((page - 1) * limit).take(limit)
      .orderBy('deal.created_at', 'DESC').getManyAndCount();
    return { data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, message: 'Deals fetched successfully' };
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
    if (dto.status !== undefined) deal.status = dto.status;
    if (dto.finalPrice !== undefined) deal.final_price = dto.finalPrice;
    if (dto.closingDate !== undefined) deal.closing_date = new Date(dto.closingDate);
    const saved = await this.dealRepo.save(deal);
    // TRG-01 trigger fires automatically in DB when status → closed
    return { data: saved, message: 'Deal updated successfully' };
  }

  async remove(id: number) {
    const deal = await this.dealRepo.findOne({ where: { deal_id: id } });
    if (!deal) throw new NotFoundException(`Deal #${id} not found`);
    deal.status = DealStatus.CANCELLED;
    const saved = await this.dealRepo.save(deal);
    return { data: saved, message: 'Deal cancelled successfully' };
  }

  async getAuditLog(dealId: number) {
    const logs = await this.dataSource.query(
      `SELECT * FROM deal_audit_log WHERE deal_id = $1 ORDER BY changed_at ASC`, [dealId]
    );
    return { data: logs, message: 'Audit log fetched successfully' };
  }
}
