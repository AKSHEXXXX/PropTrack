import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from './entities/agency.entity';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,
  ) {}

  async create(dto: CreateAgencyDto) {
    const existing = await this.agencyRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException('Agency with this email already exists');

    const agency = this.agencyRepo.create(dto);
    const saved = await this.agencyRepo.save(agency);
    return { data: saved, message: 'Agency created successfully' };
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [items, total] = await this.agencyRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['agents'],
    });
    return {
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Agencies fetched successfully',
    };
  }

  async findOne(id: number) {
    const agency = await this.agencyRepo.findOne({
      where: { agency_id: id },
      relations: ['agents'],
    });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);
    return { data: agency, message: 'Agency fetched successfully' };
  }

  async update(id: number, dto: UpdateAgencyDto) {
    const agency = await this.agencyRepo.findOne({
      where: { agency_id: id },
    });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);

    if (dto.email && dto.email !== agency.email) {
      const emailExists = await this.agencyRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExists)
        throw new ConflictException('Email already used by another agency');
    }

    Object.assign(agency, dto);
    const saved = await this.agencyRepo.save(agency);
    return { data: saved, message: 'Agency updated successfully' };
  }

  async remove(id: number) {
    const agency = await this.agencyRepo.findOne({
      where: { agency_id: id },
    });
    if (!agency) throw new NotFoundException(`Agency #${id} not found`);
    await this.agencyRepo.remove(agency);
    return { data: null, message: 'Agency deleted successfully' };
  }
}
