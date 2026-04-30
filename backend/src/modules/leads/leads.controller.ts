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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create lead' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads (paginated, filterable)' })
  findAll(@Query() filter: LeadFilterDto) {
    return this.leadsService.findAll(filter);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline breakdown by status' })
  getPipeline() {
    return this.leadsService.getPipeline();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead with full details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead status or details' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.remove(id);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({ summary: 'Add tag to lead' })
  addTag(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.leadsService.addTag(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({ summary: 'Remove tag from lead' })
  removeTag(
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.leadsService.removeTag(id, tagId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Auto-assign lead to agent with fewest leads' })
  @ApiQuery({ name: 'agencyId', required: true, type: Number })
  autoAssign(
    @Param('id', ParseIntPipe) id: number,
    @Query('agencyId', ParseIntPipe) agencyId: number,
  ) {
    return this.leadsService.autoAssign(id, agencyId);
  }
}
