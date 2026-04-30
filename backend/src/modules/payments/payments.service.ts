import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async create(dto: CreatePaymentDto) {
    const payment = this.paymentRepo.create({
      deal_id: dto.dealId,
      amount: dto.amount,
      payment_type: dto.paymentType,
      status: dto.status,
      reference_no: dto.referenceNo,
      payment_date: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
    });
    const saved = await this.paymentRepo.save(payment);
    return { data: saved, message: 'Payment recorded successfully' };
  }

  async findAll() {
    const items = await this.paymentRepo.find({
      relations: ['deal'],
      order: { created_at: 'DESC' },
    });
    return { data: items, message: 'Payments fetched successfully' };
  }

  async findOne(id: number) {
    const p = await this.paymentRepo.findOne({
      where: { payment_id: id },
      relations: ['deal'],
    });
    if (!p) throw new NotFoundException(`Payment #${id} not found`);
    return { data: p, message: 'Payment fetched successfully' };
  }

  async findByDeal(dealId: number) {
    const items = await this.paymentRepo.find({
      where: { deal_id: dealId },
      order: { payment_date: 'ASC' },
    });
    const totalPaid = items
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      data: { items, totalPaid },
      message: 'Deal payments fetched successfully',
    };
  }

  async update(id: number, dto: UpdatePaymentDto) {
    const p = await this.paymentRepo.findOne({ where: { payment_id: id } });
    if (!p) throw new NotFoundException(`Payment #${id} not found`);
    if (dto.status !== undefined) p.status = dto.status;
    const saved = await this.paymentRepo.save(p);
    return { data: saved, message: 'Payment updated successfully' };
  }
}
