import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateLeadDto) {
    // Business rule: no duplicate active leads for same client + property
    const existing = await this.leadRepo.findOne({
      where: { client_id: dto.clientId, property_id: dto.propertyId },
    });
    if (existing && !['deal_closed', 'lost'].includes(existing.status)) {
      throw new ConflictException(
        'Active lead already exists for this client and property',
      );
    }
    const lead = this.leadRepo.create({
      client_id: dto.clientId,
      property_id: dto.propertyId,
      agent_id: dto.agentId,
      budget: dto.budget,
      notes: dto.notes,
    });
    const saved = await this.leadRepo.save(lead);
    return { data: saved, message: 'Lead created successfully' };
  }

  async findAll(filter: LeadFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);
    const qb = this.leadRepo
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.client', 'client')
      .leftJoinAndSelect('lead.property', 'property')
      .leftJoinAndSelect('lead.agent', 'agent')
      .leftJoinAndSelect('lead.tags', 'tags');
    if (filter.status)
      qb.andWhere('lead.status = :status', { status: filter.status });
    if (filter.agentId)
      qb.andWhere('lead.agent_id = :agentId', {
        agentId: parseInt(filter.agentId, 10),
      });
    if (filter.propertyId)
      qb.andWhere('lead.property_id = :propertyId', {
        propertyId: parseInt(filter.propertyId, 10),
      });
    if (filter.isStale === 'true') qb.andWhere('lead.is_stale = true');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('lead.created_at', 'DESC')
      .getManyAndCount();
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Leads fetched successfully',
    };
  }

  async findOne(id: number) {
    const lead = await this.leadRepo.findOne({
      where: { lead_id: id },
      relations: ['client', 'property', 'agent', 'tags', 'appointments'],
    });
    if (!lead) throw new NotFoundException(`Lead #${id} not found`);
    return { data: lead, message: 'Lead fetched successfully' };
  }

  async update(id: number, dto: UpdateLeadDto) {
    const lead = await this.leadRepo.findOne({ where: { lead_id: id } });
    if (!lead) throw new NotFoundException(`Lead #${id} not found`);
    if (dto.status !== undefined) lead.status = dto.status;
    if (dto.notes !== undefined) lead.notes = dto.notes;
    if (dto.budget !== undefined) lead.budget = dto.budget;
    if (dto.agentId !== undefined) lead.agent_id = dto.agentId;
    lead.last_activity = new Date();
    const saved = await this.leadRepo.save(lead);
    return { data: saved, message: 'Lead updated successfully' };
  }

  async remove(id: number) {
    const lead = await this.leadRepo.findOne({ where: { lead_id: id } });
    if (!lead) throw new NotFoundException(`Lead #${id} not found`);
    await this.leadRepo.remove(lead);
    return { data: null, message: 'Lead deleted successfully' };
  }

  async getPipeline() {
    const pipeline = await this.leadRepo
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.status')
      .getRawMany();
    return { data: pipeline, message: 'Pipeline fetched successfully' };
  }

  async addTag(leadId: number, tagId: number) {
    const lead = await this.leadRepo.findOne({
      where: { lead_id: leadId },
      relations: ['tags'],
    });
    if (!lead) throw new NotFoundException(`Lead #${leadId} not found`);
    const tag = await this.tagRepo.findOne({ where: { tag_id: tagId } });
    if (!tag) throw new NotFoundException(`Tag #${tagId} not found`);
    if (!lead.tags.find((t) => t.tag_id === tagId)) {
      lead.tags.push(tag);
      await this.leadRepo.save(lead);
    }
    return { data: lead.tags, message: 'Tag added to lead' };
  }

  async removeTag(leadId: number, tagId: number) {
    const lead = await this.leadRepo.findOne({
      where: { lead_id: leadId },
      relations: ['tags'],
    });
    if (!lead) throw new NotFoundException(`Lead #${leadId} not found`);
    lead.tags = lead.tags.filter((t) => t.tag_id !== tagId);
    await this.leadRepo.save(lead);
    return { data: lead.tags, message: 'Tag removed from lead' };
  }

  async autoAssign(leadId: number, agencyId: number) {
    // Calls the stored procedure
    await this.dataSource.query(`CALL sp_auto_assign_lead($1, $2)`, [
      leadId,
      agencyId,
    ]);
    const lead = await this.leadRepo.findOne({
      where: { lead_id: leadId },
      relations: ['agent'],
    });
    return { data: lead, message: 'Lead auto-assigned successfully' };
  }
}
