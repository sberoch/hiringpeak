import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@workspace/shared/enums';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { OnboardOrganizationDto } from './onboard.dto';
import { OnboardService } from './onboard.service';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiTags('Onboard')
@Controller('onboard')
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiCreatedResponse()
  @Post('organization')
  async onboardOrganization(@Body() dto: OnboardOrganizationDto) {
    return this.onboardService.onboardOrganization(dto);
  }
}
