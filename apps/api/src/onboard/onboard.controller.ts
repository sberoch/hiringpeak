import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { InternalUserGuard } from '../auth/internal-user.guard';
import { OnboardOrganizationDto } from './onboard.dto';
import { OnboardService } from './onboard.service';

@ApiBearerAuth()
@UseGuards(InternalUserGuard)
@ApiTags('Onboard')
@Controller('onboard')
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @ApiCreatedResponse()
  @Post('organization')
  async onboardOrganization(@Body() dto: OnboardOrganizationDto) {
    return this.onboardService.onboardOrganization(dto);
  }
}
