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
import { CandidateSourceService } from './candidatesource.service';
import {
  CreateCandidateSourceDto,
  UpdateCandidateSourceDto,
  CandidateSourceQueryParams,
} from './candidatesource.dto';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionCode } from '@workspace/shared/enums';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';

@ApiBearerAuth()
@UseGuards(PermissionsGuard, OrganizationGuard)
@ApiTags('CandidateSources')
@Controller('candidateSource')
export class CandidateSourceController {
  constructor(
    private readonly candidateSourceService: CandidateSourceService,
  ) {}

  @ApiOkResponse()
  @Get()
  async findAll(
    @Query() query: CandidateSourceQueryParams,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.findAll({ ...query, organizationId });
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.findOne(+id, organizationId);
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'create_candidate_source', entityType: 'candidate_source' })
  @ApiCreatedResponse()
  @Post()
  async create(
    @Body() createCandidateSourceDto: CreateCandidateSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.create({
      ...createCandidateSourceDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'update_candidate_source', entityType: 'candidate_source' })
  @ApiOkResponse()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateSourceDto: UpdateCandidateSourceDto,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.update(+id, {
      ...updateCandidateSourceDto,
      organizationId,
    });
  }

  @Permissions(PermissionCode.SETTINGS_MANAGE)
  @AuditAction({ eventType: 'delete_candidate_source', entityType: 'candidate_source' })
  @ApiOkResponse()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: number,
  ) {
    return this.candidateSourceService.remove(+id, organizationId);
  }
}
