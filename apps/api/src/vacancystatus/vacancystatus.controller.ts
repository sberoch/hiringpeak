import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { VacancyStatusService } from './vacancystatus.service';
import {
  CreateVacancyStatusDto,
  UpdateVacancyStatusDto,
  VacancyStatusQueryParams,
} from './vacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('VacancyStatuses')
@Controller('vacancyStatus')
export class VacancyStatusController {
  constructor(
    private readonly vacancyStatusService: VacancyStatusService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: VacancyStatusQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createVacancyStatusDto: CreateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.create({
      ...createVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVacancyStatusDto: UpdateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.update(+id, {
      ...updateVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.vacancyStatusService.remove(+id, organizationId);
  }
}
