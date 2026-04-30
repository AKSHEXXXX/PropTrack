import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Agencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  create(@Body() dto: CreateAgencyDto) {
    return this.agenciesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agencies (paginated)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.agenciesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID with agents' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agency details' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgencyDto) {
    return this.agenciesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agenciesService.remove(id);
  }
}
