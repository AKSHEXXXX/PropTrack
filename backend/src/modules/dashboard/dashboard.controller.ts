import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary') @ApiOperation({ summary: 'Overall KPI counts (DAS-01)' })
  getSummary() { return this.dashboardService.getSummary(); }

  @Get('pipeline') @ApiOperation({ summary: 'Lead pipeline breakdown by status (DAS-02)' })
  getPipeline() { return this.dashboardService.getPipeline(); }

  @Get('agent-performance') @ApiOperation({ summary: 'Agents with no closed deals this month (NQ-01)' })
  getAgentPerformance() { return this.dashboardService.getAgentPerformance(); }

  @Get('unsold-viewed') @ApiOperation({ summary: 'Properties visited but never offered on (CQ-01)' })
  getUnsoldViewed() { return this.dashboardService.getUnsoldViewed(); }

  @Get('stale-leads') @ApiOperation({ summary: 'Stale leads with agent pipeline context (CQ-02)' })
  getStaleLeads() { return this.dashboardService.getStaleLeads(); }

  @Get('top-agents') @ApiOperation({ summary: 'Top 5 agents by deal value this month (NQ-02)' })
  getTopAgents() { return this.dashboardService.getTopAgents(); }

  @Get('above-average') @ApiOperation({ summary: 'Properties priced above agency average (NQ-03)' })
  getAboveAverage() { return this.dashboardService.getAboveAverageProperties(); }

  @Get('monthly-report')
  @ApiOperation({ summary: 'Full monthly report via stored procedure (PRC-02)' })
  @ApiQuery({ name: 'agencyId', type: Number, example: 1 })
  @ApiQuery({ name: 'month', type: Number, example: 8 })
  @ApiQuery({ name: 'year', type: Number, example: 2025 })
  getMonthlyReport(
    @Query('agencyId', new DefaultValuePipe(1), ParseIntPipe) agencyId: number,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month: number,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getMonthlyReport(agencyId, month, year);
  }
}
