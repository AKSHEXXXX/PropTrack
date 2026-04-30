import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {}

  async create(dto: CreateTagDto) {
    const existing = await this.tagRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Tag name already exists');
    const tag = this.tagRepo.create({
      name: dto.name,
      color: dto.color ?? '#6B7280',
    });
    const saved = await this.tagRepo.save(tag);
    return { data: saved, message: 'Tag created successfully' };
  }

  async findAll() {
    const tags = await this.tagRepo.find({ order: { name: 'ASC' } });
    return { data: tags, message: 'Tags fetched successfully' };
  }

  async remove(id: number) {
    const tag = await this.tagRepo.findOne({ where: { tag_id: id } });
    if (!tag) throw new NotFoundException(`Tag #${id} not found`);
    await this.tagRepo.remove(tag);
    return { data: null, message: 'Tag deleted successfully' };
  }
}
