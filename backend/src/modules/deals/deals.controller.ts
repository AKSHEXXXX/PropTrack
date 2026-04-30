import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, DealFilterDto } from './dto/deal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post() @ApiOperation({ summary: 'Create deal from lead (commission auto-calculated)' })
  create(@Body() dto: CreateDealDto) { return this.dealsService.create(dto); }

  @Get() @ApiOperation({ summary: 'List deals (paginated, filterable)' })
  findAll(@Query() filter: DealFilterDto) { return this.dealsService.findAll(filter); }

  @Get(':id') @ApiOperation({ summary: 'Get deal with contracts and payments' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.dealsService.findOne(id); }

  @Get(':id/audit') @ApiOperation({ summary: 'Get deal audit log (TRG-03)' })
  getAuditLog(@Param('id', ParseIntPipe) id: number) { return this.dealsService.getAuditLog(id); }

  @Patch(':id') @ApiOperation({ summary: 'Update deal status (closing triggers property→sold)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Cancel deal' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.dealsService.remove(id); }
}
