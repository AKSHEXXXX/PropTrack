import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  async create(dto: CreateContractDto) {
    const contract = this.contractRepo.create({
      deal_id: dto.dealId,
      document_url: dto.documentUrl,
      contract_type: dto.contractType,
      signed_date: dto.signedDate ? new Date(dto.signedDate) : undefined,
      expiry_date: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
    const saved = await this.contractRepo.save(contract);
    return { data: saved, message: 'Contract created successfully' };
  }

  async findAll() {
    const items = await this.contractRepo.find({
      relations: ['deal'],
      order: { created_at: 'DESC' },
    });
    return { data: items, message: 'Contracts fetched successfully' };
  }

  async findOne(id: number) {
    const c = await this.contractRepo.findOne({
      where: { contract_id: id },
      relations: ['deal'],
    });
    if (!c) throw new NotFoundException(`Contract #${id} not found`);
    return { data: c, message: 'Contract fetched successfully' };
  }

  async update(id: number, dto: UpdateContractDto) {
    const c = await this.contractRepo.findOne({ where: { contract_id: id } });
    if (!c) throw new NotFoundException(`Contract #${id} not found`);
    if (dto.status !== undefined) c.status = dto.status;
    if (dto.documentUrl !== undefined) c.document_url = dto.documentUrl;
    if (dto.signedDate !== undefined) c.signed_date = new Date(dto.signedDate);
    if (dto.expiryDate !== undefined) c.expiry_date = new Date(dto.expiryDate);
    const saved = await this.contractRepo.save(c);
    return { data: saved, message: 'Contract updated successfully' };
  }

  async remove(id: number) {
    const c = await this.contractRepo.findOne({ where: { contract_id: id } });
    if (!c) throw new NotFoundException(`Contract #${id} not found`);
    await this.contractRepo.remove(c);
    return { data: null, message: 'Contract deleted successfully' };
  }
}
