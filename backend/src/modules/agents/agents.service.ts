import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
  ) {}

  async create(dto: CreateAgentDto) {
    const existing = await this.agentRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException('Agent with this email already exists');

    const agent = this.agentRepo.create({
      agency_id: dto.agencyId,
      first_name: dto.firstName,
      last_name: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      commission_rate: dto.commissionRate ?? 0.025,
    });
    const saved = await this.agentRepo.save(agent);
    return { data: saved, message: 'Agent created successfully' };
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [items, total] = await this.agentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
      where: { is_active: true },
      relations: ['agency'],
    });
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Agents fetched successfully',
    };
  }

  async findOne(id: number) {
    const agent = await this.agentRepo.findOne({
      where: { agent_id: id },
      relations: ['agency'],
    });
    if (!agent) throw new NotFoundException(`Agent #${id} not found`);
    return { data: agent, message: 'Agent fetched successfully' };
  }

  async update(id: number, dto: UpdateAgentDto) {
    const agent = await this.agentRepo.findOne({ where: { agent_id: id } });
    if (!agent) throw new NotFoundException(`Agent #${id} not found`);

    if (dto.email && dto.email !== agent.email) {
      const emailExists = await this.agentRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExists)
        throw new ConflictException('Email already used by another agent');
    }

    const updateData: Partial<Agent> = {};
    if (dto.firstName !== undefined) updateData.first_name = dto.firstName;
    if (dto.lastName !== undefined) updateData.last_name = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.commissionRate !== undefined)
      updateData.commission_rate = dto.commissionRate;
    if (dto.agencyId !== undefined) updateData.agency_id = dto.agencyId;

    Object.assign(agent, updateData);
    const saved = await this.agentRepo.save(agent);
    return { data: saved, message: 'Agent updated successfully' };
  }

  async deactivate(id: number) {
    const agent = await this.agentRepo.findOne({ where: { agent_id: id } });
    if (!agent) throw new NotFoundException(`Agent #${id} not found`);
    agent.is_active = false;
    const saved = await this.agentRepo.save(agent);
    return { data: saved, message: 'Agent deactivated successfully' };
  }

  async getLeads(id: number) {
    const agent = await this.agentRepo.findOne({
      where: { agent_id: id },
      relations: ['leads', 'leads.client', 'leads.property'],
    });
    if (!agent) throw new NotFoundException(`Agent #${id} not found`);
    return { data: agent.leads, message: 'Agent leads fetched successfully' };
  }

  async getDeals(id: number) {
    const agent = await this.agentRepo.findOne({
      where: { agent_id: id },
      relations: ['deals', 'deals.property', 'deals.client'],
    });
    if (!agent) throw new NotFoundException(`Agent #${id} not found`);
    return { data: agent.deals, message: 'Agent deals fetched successfully' };
  }
}
