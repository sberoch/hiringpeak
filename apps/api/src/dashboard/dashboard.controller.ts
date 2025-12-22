import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOkResponse()
  @Get()
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
