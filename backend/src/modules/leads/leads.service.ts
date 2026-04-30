import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Agent } from '../agents/entities/agent.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateLeadDto, LeadFilterDto, UpdateLeadDto } from './dto/lead.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Agent) private readonly agentRepo: Repository<Agent>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateLeadDto) {
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
    lead.is_stale = false;
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
    if (!lead.tags.find((existingTag) => existingTag.tag_id === tagId)) {
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
    lead.tags = lead.tags.filter((tag) => tag.tag_id !== tagId);
    await this.leadRepo.save(lead);
    return { data: lead.tags, message: 'Tag removed from lead' };
  }

  async autoAssign(leadId: number, agencyId: number) {
    const lead = await this.leadRepo.findOne({ where: { lead_id: leadId } });
    if (!lead) throw new NotFoundException(`Lead #${leadId} not found`);

    const agents = await this.agentRepo.find({
      where: { agency_id: agencyId, is_active: true },
      relations: ['leads'],
    });
    if (agents.length === 0) {
      throw new NotFoundException(
        `No active agents found for agency #${agencyId}`,
      );
    }

    const selectedAgent = agents
      .map((agent) => ({
        agent,
        activeLeadCount: agent.leads.filter(
          (candidateLead) =>
            !['deal_closed', 'lost'].includes(candidateLead.status),
        ).length,
      }))
      .sort((left, right) => {
        if (left.activeLeadCount === right.activeLeadCount) {
          return left.agent.agent_id - right.agent.agent_id;
        }
        return left.activeLeadCount - right.activeLeadCount;
      })[0]?.agent;

    lead.agent_id = selectedAgent.agent_id;
    const saved = await this.leadRepo.save(lead);

    if (process.env.DB_TYPE !== 'pg-mem') {
      try {
        await this.dataSource.query(`CALL sp_auto_assign_lead($1, $2)`, [
          leadId,
          agencyId,
        ]);
      } catch {
        // The JS fallback above keeps local/test environments runnable.
      }
    }

    const assignedLead = await this.leadRepo.findOne({
      where: { lead_id: saved.lead_id },
      relations: ['agent'],
    });
    return { data: assignedLead, message: 'Lead auto-assigned successfully' };
  }
}
