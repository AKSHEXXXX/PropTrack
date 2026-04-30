import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto, ClientFilterDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto) {
    if (dto.email) {
      const existing = await this.clientRepo.findOne({
        where: { email: dto.email },
      });
      if (existing)
        throw new ConflictException('Client with this email already exists');
    }

    const client = this.clientRepo.create({
      first_name: dto.firstName,
      last_name: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      client_type: dto.clientType,
      nationality: dto.nationality,
    });
    const saved = await this.clientRepo.save(client);
    return { data: saved, message: 'Client created successfully' };
  }

  async findAll(filter: ClientFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);

    const qb = this.clientRepo.createQueryBuilder('client');

    if (filter.clientType) {
      qb.andWhere('client.client_type = :type', { type: filter.clientType });
    }
    if (filter.search) {
      qb.andWhere(
        '(client.first_name ILIKE :search OR client.last_name ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('client.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Clients fetched successfully',
    };
  }

  async findOne(id: number) {
    const client = await this.clientRepo.findOne({
      where: { client_id: id },
      relations: ['leads', 'leads.property', 'leads.agent'],
    });
    if (!client) throw new NotFoundException(`Client #${id} not found`);
    return { data: client, message: 'Client fetched successfully' };
  }

  async update(id: number, dto: UpdateClientDto) {
    const client = await this.clientRepo.findOne({
      where: { client_id: id },
    });
    if (!client) throw new NotFoundException(`Client #${id} not found`);

    const updateData: Partial<Client> = {};
    if (dto.firstName !== undefined) updateData.first_name = dto.firstName;
    if (dto.lastName !== undefined) updateData.last_name = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.clientType !== undefined) updateData.client_type = dto.clientType;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;

    Object.assign(client, updateData);
    const saved = await this.clientRepo.save(client);
    return { data: saved, message: 'Client updated successfully' };
  }

  async remove(id: number) {
    const client = await this.clientRepo.findOne({
      where: { client_id: id },
      relations: ['leads'],
    });
    if (!client) throw new NotFoundException(`Client #${id} not found`);

    const activeLeads = client.leads?.filter(
      (l) => !['deal_closed', 'lost'].includes(l.status),
    );
    if (activeLeads && activeLeads.length > 0) {
      throw new BadRequestException(
        'Cannot delete client with active leads',
      );
    }

    await this.clientRepo.remove(client);
    return { data: null, message: 'Client deleted successfully' };
  }
}
