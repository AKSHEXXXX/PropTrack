import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyImage } from './entities/property-image.entity';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyFilterDto,
  AddImageDto,
} from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property) private readonly propRepo: Repository<Property>,
    @InjectRepository(PropertyImage)
    private readonly imgRepo: Repository<PropertyImage>,
  ) {}

  async create(dto: CreatePropertyDto) {
    const property = this.propRepo.create({
      agent_id: dto.agentId,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      city: dto.city ?? 'Dubai',
      price: dto.price,
      area_sqft: dto.areaSqft,
      property_type: dto.propertyType,
      status: dto.status,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
    });
    const saved = await this.propRepo.save(property);
    return { data: saved, message: 'Property created successfully' };
  }

  async findAll(filter: PropertyFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '20', 10);
    const qb = this.propRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.agent', 'agent')
      .leftJoinAndSelect('p.images', 'images');
    if (filter.propertyType)
      qb.andWhere('p.property_type = :pt', { pt: filter.propertyType });
    if (filter.status) qb.andWhere('p.status = :st', { st: filter.status });
    if (filter.city)
      qb.andWhere('p.city ILIKE :city', { city: `%${filter.city}%` });
    if (filter.minPrice !== undefined)
      qb.andWhere('p.price >= :min', { min: filter.minPrice });
    if (filter.maxPrice !== undefined)
      qb.andWhere('p.price <= :max', { max: filter.maxPrice });
    if (filter.minBedrooms !== undefined)
      qb.andWhere('p.bedrooms >= :mb', { mb: filter.minBedrooms });
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('p.created_at', 'DESC')
      .getManyAndCount();
    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Properties fetched successfully',
    };
  }

  async findOne(id: number) {
    const p = await this.propRepo.findOne({
      where: { property_id: id },
      relations: ['agent', 'images'],
    });
    if (!p) throw new NotFoundException(`Property #${id} not found`);
    return { data: p, message: 'Property fetched successfully' };
  }

  async update(id: number, dto: UpdatePropertyDto) {
    const p = await this.propRepo.findOne({ where: { property_id: id } });
    if (!p) throw new NotFoundException(`Property #${id} not found`);
    if (dto.agentId !== undefined) p.agent_id = dto.agentId;
    if (dto.title !== undefined) p.title = dto.title;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.location !== undefined) p.location = dto.location;
    if (dto.city !== undefined) p.city = dto.city;
    if (dto.price !== undefined) p.price = dto.price;
    if (dto.areaSqft !== undefined) p.area_sqft = dto.areaSqft;
    if (dto.propertyType !== undefined) p.property_type = dto.propertyType;
    if (dto.status !== undefined) p.status = dto.status;
    if (dto.bedrooms !== undefined) p.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) p.bathrooms = dto.bathrooms;
    const saved = await this.propRepo.save(p);
    return { data: saved, message: 'Property updated successfully' };
  }

  async remove(id: number) {
    const p = await this.propRepo.findOne({
      where: { property_id: id },
      relations: ['leads'],
    });
    if (!p) throw new NotFoundException(`Property #${id} not found`);
    const active = p.leads?.filter(
      (l) => !['deal_closed', 'lost'].includes(l.status),
    );
    if (active?.length)
      throw new BadRequestException('Cannot delete property with active leads');
    await this.propRepo.remove(p);
    return { data: null, message: 'Property deleted successfully' };
  }

  async addImage(id: number, dto: AddImageDto) {
    const p = await this.propRepo.findOne({ where: { property_id: id } });
    if (!p) throw new NotFoundException(`Property #${id} not found`);
    if (dto.isPrimary)
      await this.imgRepo.update(
        { property_id: id, is_primary: true },
        { is_primary: false },
      );
    const img = this.imgRepo.create({
      property_id: id,
      image_url: dto.imageUrl,
      is_primary: dto.isPrimary ?? false,
    });
    const saved = await this.imgRepo.save(img);
    return { data: saved, message: 'Image added successfully' };
  }

  async removeImage(propertyId: number, imageId: number) {
    const img = await this.imgRepo.findOne({
      where: { image_id: imageId, property_id: propertyId },
    });
    if (!img) throw new NotFoundException(`Image #${imageId} not found`);
    await this.imgRepo.remove(img);
    return { data: null, message: 'Image removed successfully' };
  }
}
