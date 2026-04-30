import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}
  @Post() @ApiOperation({ summary: 'Attach contract to deal' }) create(
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(dto);
  }
  @Get() @ApiOperation({ summary: 'List all contracts' }) findAll() {
    return this.contractsService.findAll();
  }
  @Get(':id') @ApiOperation({ summary: 'Get contract details' }) findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contractsService.findOne(id);
  }
  @Patch(':id') @ApiOperation({ summary: 'Update contract status' }) update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete contract' }) remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contractsService.remove(id);
  }
}
