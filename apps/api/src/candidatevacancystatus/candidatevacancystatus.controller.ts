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
import { AuditAction } from '../audit-log/audit-action.decorator';
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import {
  CreateCandidateVacancyStatusDto,
  UpdateCandidateVacancyStatusDto,
  CandidateVacancyStatusQueryParams,
} from './candidatevacancystatus.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
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

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'create_candidate_vacancy_status', entityType: 'candidate_vacancy_status' })
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

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'update_candidate_vacancy_status', entityType: 'candidate_vacancy_status' })
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

  @Permissions(PermissionCode.VACANCY_MANAGE)
  @AuditAction({ eventType: 'delete_candidate_vacancy_status', entityType: 'candidate_vacancy_status' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateVacancyStatusService.remove(+id, organizationId);
  }
}
