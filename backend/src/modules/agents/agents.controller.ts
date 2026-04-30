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
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active agents (paginated)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.agentsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID with stats' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.findOne(id);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: "Get agent's assigned leads" })
  getLeads(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.getLeads(id);
  }

  @Get(':id/deals')
  @ApiOperation({ summary: "Get agent's deals" })
  getDeals(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.getDeals(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent details' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate agent (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.deactivate(id);
  }
}
