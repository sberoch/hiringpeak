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
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import {
  CreateCandidateVacancyStatusDto,
  UpdateCandidateVacancyStatusDto,
  CandidateVacancyStatusQueryParams,
} from './candidatevacancystatus.dto';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(RolesGuard, OrganizationGuard)
@ApiTags('CandidateVacancyStatuses')
@Controller('candidateVacancyStatus')
export class CandidateVacancyStatusController {
  constructor(
    private readonly candidateVacancyStatusService: CandidateVacancyStatusService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateVacancyStatusQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyStatusService.findAll({
      ...query,
      organizationId,
    });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyStatusService.findOne(+id, organizationId);
  }

  @Roles(UserRole.ADMIN)
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCandidateVacancyStatusDto: CreateCandidateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyStatusService.create({
      ...createCandidateVacancyStatusDto,
      organizationId,
    });
  }

  @Roles(UserRole.ADMIN)
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateVacancyStatusDto: UpdateCandidateVacancyStatusDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyStatusService.update(+id, {
      ...updateCandidateVacancyStatusDto,
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
    return this.candidateVacancyStatusService.remove(+id, organizationId);
  }
}
