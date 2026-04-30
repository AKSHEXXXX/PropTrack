import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Post() @ApiOperation({ summary: 'Record a payment' }) create(@Body() dto: CreatePaymentDto) { return this.paymentsService.create(dto); }
  @Get() @ApiOperation({ summary: 'List all payments' }) findAll() { return this.paymentsService.findAll(); }
  @Get('deal/:dealId') @ApiOperation({ summary: 'Get all payments for a deal' }) findByDeal(@Param('dealId', ParseIntPipe) dealId: number) { return this.paymentsService.findByDeal(dealId); }
  @Get(':id') @ApiOperation({ summary: 'Get payment details' }) findOne(@Param('id', ParseIntPipe) id: number) { return this.paymentsService.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update payment status' }) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) { return this.paymentsService.update(id, dto); }
}
