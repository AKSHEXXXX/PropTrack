import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentFilterDto,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    // Business rule: no two appointments for same agent at same time
    const clash = await this.apptRepo.findOne({
      where: {
        agent_id: dto.agentId,
        scheduled_at: new Date(dto.scheduledAt),
        status: AppointmentStatus.SCHEDULED,
      },
    });
    if (clash)
      throw new ConflictException(
        'Agent already has an appointment at this time',
      );

    const appt = this.apptRepo.create({
      lead_id: dto.leadId,
      agent_id: dto.agentId,
      client_id: dto.clientId,
      property_id: dto.propertyId,
      scheduled_at: new Date(dto.scheduledAt),
      type: dto.type,
      notes: dto.notes,
    });
    const saved = await this.apptRepo.save(appt);
    return { data: saved, message: 'Appointment scheduled successfully' };
  }

  async findAll(filter: AppointmentFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);
    const qb = this.apptRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.agent', 'agent')
      .leftJoinAndSelect('a.client', 'client')
      .leftJoinAndSelect('a.property', 'property');
    if (filter.agentId)
      qb.andWhere('a.agent_id = :agentId', {
        agentId: parseInt(filter.agentId, 10),
      });
    if (filter.status)
      qb.andWhere('a.status = :status', { status: filter.status });
    if (filter.from)
      qb.andWhere('a.scheduled_at >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('a.scheduled_at <= :to', { to: filter.to });
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('a.scheduled_at', 'ASC')
      .getManyAndCount();
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Appointments fetched',
    };
  }

  async findOne(id: number) {
    const a = await this.apptRepo.findOne({
      where: { appointment_id: id },
      relations: ['agent', 'client', 'property', 'lead'],
    });
    if (!a) throw new NotFoundException(`Appointment #${id} not found`);
    return { data: a, message: 'Appointment fetched successfully' };
  }

  async getUpcoming() {
    const items = await this.apptRepo.find({
      where: {
        status: AppointmentStatus.SCHEDULED,
        scheduled_at: MoreThanOrEqual(new Date()),
      },
      relations: ['agent', 'client', 'property'],
      order: { scheduled_at: 'ASC' },
      take: 20,
    });
    return { data: items, message: 'Upcoming appointments fetched' };
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    const a = await this.apptRepo.findOne({ where: { appointment_id: id } });
    if (!a) throw new NotFoundException(`Appointment #${id} not found`);
    if (dto.status !== undefined) a.status = dto.status;
    if (dto.scheduledAt !== undefined)
      a.scheduled_at = new Date(dto.scheduledAt);
    if (dto.notes !== undefined) a.notes = dto.notes;
    const saved = await this.apptRepo.save(a);
    return { data: saved, message: 'Appointment updated successfully' };
  }

  async remove(id: number) {
    const a = await this.apptRepo.findOne({ where: { appointment_id: id } });
    if (!a) throw new NotFoundException(`Appointment #${id} not found`);
    await this.apptRepo.remove(a);
    return { data: null, message: 'Appointment cancelled successfully' };
  }
}
